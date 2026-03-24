import { toRaw } from 'vue';
import { Store } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import semver from 'semver';
import { NAMESPACE } from '@shell/config/types';
import {
  KUBEWARDEN, Severity, Result, PolicyReport, ClusterPolicyReport, PolicyReportResult, PolicyReportSummary, OPEN_REPORTS
} from '@kubewarden/types';
import * as coreTypes from '@kubewarden/core/core-resources';
import { createKubewardenRoute } from '@kubewarden/utils/custom-routing';
import { splitGroupKind, isResourceNamespaced } from './core';

interface CacheEntry<T> {
  promise: Promise<T>;
  timestamp: number;
}

const reportCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CHUNK_SIZE = 1000;

export function __clearReportCache() {
  reportCache.clear();
}

/**
 * Fetches either PolicyReports or ClusterPolicyReports based on version compatibility and dispatches update actions.
 * @param store
 * @param isClusterLevel
 * @param resourceType
 * @returns `PolicyReport[] | ClusterPolicyReport[] | void`
 */
export async function getReports<T extends PolicyReport | ClusterPolicyReport>(
  store: Store<any>,
  isClusterLevel: boolean = false,
  resourceType?: string
): Promise<T[] | void> {
  const now = Date.now();
  const reportTypes: string[] = [];

  if (isClusterLevel) {
    reportTypes.push(OPEN_REPORTS.CLUSTER_POLICY_REPORT.TYPE);
  }

  if (resourceType || !isClusterLevel) {
    reportTypes.push(OPEN_REPORTS.POLICY_REPORT.TYPE);
  }

  // Map over the report types to get (or create) the promise for each
  const fetchPromises = reportTypes.map((reportType) => {
    const cachedEntry = reportCache.get(reportType);

    if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL) {
      return cachedEntry.promise;
    }

    const promise = (async() => {
      const schema = store.getters['cluster/schemaFor'](reportType);

      if (!schema) {
        return [];
      }

      let reports = toRaw(store.getters['cluster/all'](reportType));

      if (isEmpty(reports)) {
        reports = toRaw(await store.dispatch('cluster/findAll', { type: reportType }, { root: true }));
      }

      if (!isEmpty(reports)) {
        // Cache the reports right away so subsequent calls don’t trigger a new fetch
        // (even though the store will eventually be updated asynchronously).
        const updateAction = reportType === OPEN_REPORTS.CLUSTER_POLICY_REPORT.TYPE ? 'kubewarden/updateClusterPolicyReports' : 'kubewarden/updatePolicyReports';

        await processReportsInBatches(store, reports, updateAction);
      }

      return reports;
    })();

    // Save the pending promise in the cache.
    reportCache.set(reportType, {
      promise,
      timestamp: now
    });

    return promise;
  });

  const results = await Promise.all(fetchPromises);

  // Now that all chunked updates are done, regenerate the summary map *once*
  await store.dispatch('kubewarden/regenerateSummaryMap');

  return results.flat();
}

/**
 * Processes reports in batches to prevent UI blocking
 */
async function processReportsInBatches(
  store: Store<any>,
  reports: Array<PolicyReport | ClusterPolicyReport>,
  action: string
): Promise<void> {
  const totalReports = reports.length;

  return new Promise((resolve) => {
    let index = 0;

    const processBatch = () => {
      const batch = reports.slice(index, index + CHUNK_SIZE);

      index += CHUNK_SIZE;

      if (batch.length > 0) {
        try {
          store.dispatch(action, batch);
        } catch (error) {
          console.error(`Failed to dispatch ${ action }:`, error);
        }
      }

      if (index < totalReports) {
        if ('requestIdleCallback' in window) {
          // requestIdleCallback() ensures work is done when the browser is idle
          requestIdleCallback(processBatch);
        } else {
          // defers execution, but does not account for UI responsiveness.
          setTimeout(processBatch, 0);
        }
      } else {
        resolve();
      }
    };

    processBatch();
  });
}

/**
 * Generates a map of { [resourceId]: PolicyReportSummary } for all PolicyReports
 * and ClusterPolicyReports currently in the store.
 */
export function generateSummaryMap(storeState: any): Record<string, PolicyReportSummary> {
  const summaryMap: Record<string, PolicyReportSummary> = {};

  function processReport(report: PolicyReport | ClusterPolicyReport) {
    // Skip non-Kubewarden managed
    if (report.metadata?.labels?.['app.kubernetes.io/managed-by'] !== 'kubewarden') {
      return;
    }

    // Determine resource ID
    let resourceId: string | undefined;

    if (report.scope) {
      resourceId = report.scope.namespace ? `${ report.scope.namespace }/${ report.scope.name }` : report.scope.name;
    }

    if (!resourceId) {
      return;
    }

    if (!summaryMap[resourceId]) {
      summaryMap[resourceId] = {
        pass:  0,
        fail:  0,
        warn:  0,
        error: 0,
        skip:  0
      };
    }

    report.results?.forEach((r) => {
      const key = r.result?.toLowerCase() as keyof PolicyReportSummary;

      if (key && summaryMap[resourceId][key] !== undefined) {
        summaryMap[resourceId][key]! += 1;
      }
    });
  }

  // Process clusterPolicyReports
  storeState.clusterPolicyReports.forEach(processReport);

  // Process policyReports
  storeState.policyReports.forEach(processReport);

  return summaryMap;
}

/**
 * Filters PolicyReports for namespaced resources or the Namespace resource type
 * @param store
 * @param resource
 * @returns `PolicyReport | PolicyReportResult[] | null | void`
 */
export async function getFilteredReport(store: Store<any>, resource: any): Promise<PolicyReport | ClusterPolicyReport | null> {
  const schema = store.getters['cluster/schemaFor'](resource?.type);

  if (schema) {
    try {
      // Determine if we need to fetch cluster level reports or resource-specific reports
      const isClusterLevel = resource?.type === NAMESPACE || !isResourceNamespaced(resource);
      const resourceType = resource?.type;

      // Fetch the appropriate reports based on the resource context
      const reports = await getReports(store, isClusterLevel, resourceType);

      if (reports && !isEmpty(reports)) {
        // Filter and return the applicable report
        const filteredReport = store.getters['kubewarden/reportByResourceId'](resource.id) || null;

        return filteredReport;
      }
    } catch (e) {
      console.warn(`Error fetching PolicyReports: ${ e }`);
    }
  }

  return null;
}

/**
 * Finds the resource (policy) that is connected to the PolicyReportResult and returns the route.
 * @param store
 * @param report: `PolicyReportResult`
 * @returns `createKubewardenRoute` | Will return a route to either a ClusterAdmissionPolicy or AdmissionPolicy
 */
export function getLinkForPolicy(store: Store<any>, report: PolicyReportResult): object | void {
  if (report?.policy) {
    const apSchema = store.getters['cluster/schemaFor'](KUBEWARDEN.ADMISSION_POLICY);
    const capSchema = store.getters['cluster/schemaFor'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY);
    const policyType: string = report.properties?.['policy-namespace'] ? KUBEWARDEN.ADMISSION_POLICY : KUBEWARDEN.CLUSTER_ADMISSION_POLICY;
    const policyName = report.properties?.['policy-name'];

    if (policyType === KUBEWARDEN.ADMISSION_POLICY && apSchema) {
      return createKubewardenRoute({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource:  policyType,
          id:        policyName,
          namespace: report.properties?.['policy-namespace']
        }
      });
    }

    if (policyType === KUBEWARDEN.CLUSTER_ADMISSION_POLICY && capSchema) {
      return createKubewardenRoute({
        name:   'c-cluster-product-resource-id',
        params: {
          resource: policyType,
          id:       policyName
        }
      });
    }
  }
}

/**
 * Finds the resource link from a policy report for a Namespace's tab component. Since the `type` is
 * not passed in from the report, it needs to be determined by the `kind` of the resource. For core
 * resources this works as is, but for non-core resources (e.g. `apps.deployments`), this is extrapolated
 * by the `apiVersion` combined with the `kind`.
 * @param report: `PolicyReport
 * @returns `Route | void`
 */
export function getLinkForResource(report: PolicyReport): object | void {
  if (!isEmpty(report.scope)) {
    const resource = report.scope;

    if (resource) {
      const isCore = Object.values(coreTypes).find((type) => resource.kind === type.attributes.kind);
      let resourceType;

      if (isCore) {
        resourceType = resource.kind.toLowerCase();
      } else {
        resourceType = splitGroupKind(resource);
      }

      if (resourceType) {
        if (resource.namespace) {
          return {
            name:   'c-cluster-product-resource-namespace-id',
            params: {
              resource:  resourceType,
              id:        resource.name,
              namespace: resource.namespace
            }
          };
        }

        return {
          name:   'c-cluster-product-resource-id',
          params: {
            resource: resourceType,
            id:       resource.name
          }
        };
      }
    }
  }
}

/**
 * Determines color for PolicyReport status
 * @param result | PolicyReport summary result || report resource.result
 * @returns string
 */
export function colorForResult(result: Result): string {
  switch (result) {
  case Result.FAIL:
    return 'text-error';
  case Result.ERROR:
    return 'sizzle-warning';
  case Result.PASS:
    return 'text-success';
  case Result.WARN:
    return 'text-warning';
  case Result.SKIP:
    return 'text-darker';
  default:
    return 'text-muted';
  }
}

/**
 * Determines color for PolicyReport severity
 * @param severity | PolicyReport severity
 * @returns string
 */
export function colorForSeverity(severity: Severity): string {
  switch (severity) {
  case Severity.INFO:
    return 'bg-info';
  case Severity.LOW:
    return 'bg-warning';
  case Severity.MEDIUM:
    return 'bg-warning';
  case Severity.HIGH:
    return 'bg-warning';
  case Severity.CRITICAL:
    return 'bg-critical';
  default:
    return 'bg-muted';
  }
}

/**
 * Determines if the kubewarden-controller app has a compatible version for PolicyReports,
 * for kubewarden-controller version `>= 1.11` it requires an extension version of `>= 1.4.0`
 * for kubewarden-controller version `<= 1.10` it requires an extension version of `< 1.4.0`
 * @param string
 * @param string
 * @returns Object
 */
export function newPolicyReportCompatible(controllerAppVersion: string, uiPluginVersion: string): object | void {
  if (semver.gte(uiPluginVersion, '1.4.0')) {
    return {
      oldPolicyReports: semver.gt(controllerAppVersion, '1.10.100'),
      newPolicyReports:  true
    };
  }

  if (semver.lt(uiPluginVersion, '1.4.0')) {
    return {
      oldPolicyReports: true,
      newPolicyReports:  semver.lte(controllerAppVersion, '1.10.100')
    };
  }

  return {
    oldPolicyReports: true,
    newPolicyReports:  true
  };
}
