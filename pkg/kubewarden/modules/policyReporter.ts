import { Store } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import semver from 'semver';
import { randomStr } from '@shell/utils/string';
import { NAMESPACE } from '@shell/config/types';
import {
  KUBEWARDEN, CatalogApp, Severity, Result, PolicyReport, ClusterPolicyReport, PolicyReportResult, PolicyReportSummary, WG_POLICY_K8S
} from '../types';
import * as coreTypes from '../core/core-resources';
import { createKubewardenRoute } from '../utils/custom-routing';
import { splitGroupKind, isResourceNamespaced } from './core';
import { fetchControllerApp } from './kubewardenController';

function isValidAppVersion(controllerApp?: CatalogApp): boolean {
  return !!controllerApp &&
         !!controllerApp.spec?.chart?.metadata?.appVersion &&
         semver.gte(controllerApp.spec.chart.metadata.appVersion, '1.10.100');
}

/**
 * Fetches either PolicyReports or ClusterPolicyReports based on version compatibility and dispatches update actions.
 * @param store
 * @param isClusterLevel
 * @returns `PolicyReport[] | ClusterPolicyReport[] | void`
 */
export async function getReports(
  store: Store<any>,
  isClusterLevel: boolean = false,
  resourceType?: string
): Promise<Array<PolicyReport | ClusterPolicyReport> | void> {
  let outReports: Array<PolicyReport | ClusterPolicyReport> = [];
  const reportTypes = [];

  if ( isClusterLevel ) {
    reportTypes.push(WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE);
  }

  if ( resourceType || !isClusterLevel ) {
    reportTypes.push(WG_POLICY_K8S.POLICY_REPORT.TYPE);
  }

  for ( const reportType of reportTypes ) {
    const schema = store.getters['cluster/schemaFor'](reportType);
    let controllerApp: CatalogApp | undefined = store.getters['kubewarden/controllerApp'];

    if ( !controllerApp ) {
      controllerApp = await fetchControllerApp(store);
    }

    if ( schema ) {
      try {
        const reports = await store.dispatch('cluster/findAll', { type: reportType }, { root: true });

        if ( !isEmpty(reports) ) {
          const updateAction = reportType === WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE ? 'kubewarden/updateClusterPolicyReports' : 'kubewarden/updatePolicyReports';

          reports.forEach((report: PolicyReport | ClusterPolicyReport) => store.dispatch(updateAction, report));

          outReports = outReports.concat(reports);
        }
      } catch (e) {
        console.warn(`Error fetching ${ reportType }: ${ e }`); // eslint-disable-line no-console
      }
    }
  }

  return outReports;
}

/**
 * Retrieves a filtered summary for both PolicyReports and ClusterPolicyReports.
 * @param store The store containing the reports.
 * @param resource The resource for which the summary is generated.
 * @param isClusterLevel Flag to determine if the summary should include cluster level reports.
 * @returns `PolicyReportSummary`.
 */
export function getFilteredSummary(
  store: Store<any>,
  resource: any,
  isClusterLevel: boolean = false
): PolicyReportSummary {
  const outSummary: PolicyReportSummary = {
    pass:  0,
    fail:  0,
    warn:  0,
    error: 0,
    skip:  0
  };
  const reportTypes: string[] = [];

  if ( isClusterLevel || resource?.type === NAMESPACE ) {
    reportTypes.push(WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE);
  }

  if ( isResourceNamespaced(resource) || resource?.type === NAMESPACE ) {
    reportTypes.push(WG_POLICY_K8S.POLICY_REPORT.TYPE);
  }

  for ( const report of reportTypes ) {
    const storeKey = report === WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE ? 'clusterPolicyReports' : 'policyReports';
    const reports = store.getters[`kubewarden/${ storeKey }`];

    if ( !isEmpty(reports) ) {
      const filtered: PolicyReportResult[] = getFilteredArrayOfReportResults(reports, resource, report === WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE);

      if ( !isEmpty(filtered) ) {
        filtered.forEach((r: PolicyReportResult) => {
          const resultVal = r.result;

          if ( resultVal ) {
            (outSummary as any)[resultVal]++;
          }
        });
      }
    }
  }

  return outSummary;
}

/**
 * Helper function to filter report results based on resource type and managed-by labels
 * @param reports
 * @param resource
 * @returns `PolicyReportResult[]`
 */
function getFilteredArrayOfReportResults(
  reports: Array<PolicyReport | ClusterPolicyReport>,
  resource: any,
  isClusterLevel?: boolean
): PolicyReportResult[] {
  let outReports: Array<PolicyReport | ClusterPolicyReport> = [];

  // Filter out reports based on 'app.kubernetes.io/managed-by' label
  reports = reports.filter(report => report.metadata?.labels?.['app.kubernetes.io/managed-by'] === 'kubewarden');

  if ( resource?.type === NAMESPACE ) {
    if ( isClusterLevel ) {
      // Include both PolicyReports and ClusterPolicyReports for Namespace when isClusterLevel is true
      outReports = reports.filter((report) => {
        if (report.scope) {
          return (
            report.scope.name === resource.name ||
            (('namespace' in report.scope) && report.scope.namespace === resource.name)
          );
        }
      });
    } else {
      // Filter PolicyReports for namespace scope
      outReports = reports.filter((report) => {
        if ( report.scope ) {
          return 'namespace' in report.scope && report.scope.namespace === resource?.name;
        }
      });
    }
  } else {
    outReports = reports;
  }

  const outResults: PolicyReportResult[] = [];

  // Find the report that is scoped to the resource name
  if ( resource?.type === 'namespace' ) {
    outReports.forEach((report: any) => {
      report.results?.forEach((result: any) => {
        outResults.push({
          ...result,
          scope:      report.scope,
          kind:       report.kind,
          policyName: result.properties?.['policy-name'],
        });
      });
    });
  } else {
    outReports.forEach((report: any) => {
      if ( report.scope?.name === resource.metadata.name ) {
        report.results?.forEach((result: any) => {
          outResults.push({
            ...result,
            policyName: result.properties?.['policy-name'],
          });
        });
      }
    });
  }

  if ( !isEmpty(outResults) ) {
    // Assign uid for SortableTable sub-row
    outResults?.forEach((report: any) => {
      Object.assign(report, { uid: randomStr() });
    });
  }

  return outResults;
}

/**
 * Filters PolicyReports for namespaced resources or the Namespace resource type
 * @param store
 * @param resource
 * @returns `PolicyReport | PolicyReportResult[] | null | void`
 */
export async function getFilteredReports(store: Store<any>, resource: any): Promise<PolicyReport[] | PolicyReportResult[] | null | void> {
  const schema = store.getters['cluster/schemaFor'](resource?.type);

  if ( schema ) {
    try {
      // Determine if we need to fetch cluster level reports or resource-specific reports
      const isClusterLevel = resource?.type === NAMESPACE || !isResourceNamespaced(resource);
      const resourceType = resource?.type;

      // Fetch the appropriate reports based on the resource context
      const reports = await getReports(store, isClusterLevel, resourceType);

      if ( reports && !isEmpty(reports) ) {
        // Filter and return the applicable report results
        return getFilteredArrayOfReportResults(reports, resource, isClusterLevel);
      }
    } catch (e) {
      console.warn(`Error fetching PolicyReports: ${ e }`); // eslint-disable-line no-console
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
export function getLinkForPolicy(store: Store<any>, report: PolicyReportResult): Object | void {
  if ( report?.policy ) {
    const apSchema = store.getters['cluster/schemaFor'](KUBEWARDEN.ADMISSION_POLICY);
    const capSchema = store.getters['cluster/schemaFor'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY);
    const policyType: string = report.properties?.['policy-namespace'] ? KUBEWARDEN.ADMISSION_POLICY : KUBEWARDEN.CLUSTER_ADMISSION_POLICY;

    if ( policyType === KUBEWARDEN.ADMISSION_POLICY && apSchema ) {
      return createKubewardenRoute({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource: policyType, id: report?.policyName, namespace: report.properties?.['policy-namespace']
        }
      });
    }

    if ( policyType === KUBEWARDEN.CLUSTER_ADMISSION_POLICY && capSchema ) {
      return createKubewardenRoute({
        name:   'c-cluster-product-resource-id',
        params: { resource: policyType, id: report?.policyName }
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
export function getLinkForResource(report: PolicyReport): Object | void {
  if ( !isEmpty(report.scope) ) {
    const resource = report.scope;

    if ( resource ) {
      const isCore = Object.values(coreTypes).find(type => resource.kind === type.attributes.kind);
      let resourceType;

      if ( isCore ) {
        resourceType = resource.kind.toLowerCase();
      } else {
        resourceType = splitGroupKind(resource);
      }

      if ( resourceType ) {
        if ( resource.namespace ) {
          return {
            name:   'c-cluster-product-resource-namespace-id',
            params: {
              resource: resourceType, id: resource.name, namespace: resource.namespace
            }
          };
        }

        return {
          name:   'c-cluster-product-resource-id',
          params: { resource: resourceType, id: resource.name }
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
export function newPolicyReportCompatible(controllerAppVersion: string, uiPluginVersion: string): Object | void {
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