import { Store } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import semver from 'semver';
import { randomStr } from '@shell/utils/string';
import {
  KUBEWARDEN, CatalogApp, Severity, Result, PolicyReport, PolicyReportResult, PolicyReportSummary, WG_POLICY_K8S
} from '../types';
import * as coreTypes from '../core/core-resources';
import { createKubewardenRoute } from '../utils/custom-routing';
import { splitGroupKind } from './core';
import { fetchControllerApp } from './kubewardenController';

/**
 * Attempts to fetch PolicyReports by dispatching a findAll against `wgpolicyk8s.io.policyreport`
 * @param store
 * @returns `PolicyReport[] | void` - Scaffolded value of a PolicyReport accomplished by scaffoldPolicyReport()
 */
export async function getPolicyReports(store: Store<any>): Promise<PolicyReport[] | void> {
  const schema = store.getters['cluster/schemaFor'](WG_POLICY_K8S.POLICY_REPORT.TYPE);
  let controllerApp: CatalogApp | undefined = store.getters['kubewarden/controllerApp'];

  if ( !controllerApp ) {
    controllerApp = await fetchControllerApp(store);
  }

  if ( schema && controllerApp && controllerApp?.spec?.chart?.metadata?.appVersion ) {
    // only fetch reports if app version is compatible with new data structure
    if ( semver.gte(controllerApp.spec.chart.metadata.appVersion, '1.10.100') ) {
      try {
        const reports = await fetchPolicyReports(store);

        if ( !isEmpty(reports) ) {
          reports?.forEach((report: PolicyReport) => store.dispatch('kubewarden/updatePolicyReports', report));

          return reports;
        }
      } catch (e) {
        console.warn(`Error fetching PolicyReports: ${ e }`); // eslint-disable-line no-console
      }
    }
  }
}

/**
 * Dispatches findAll for PolicyReports (`wgpolicyk8s.io.policyreport`)
 * @param store
 * @returns `PolicyReport[] | void`
 */
export async function fetchPolicyReports(store: Store<any>): Promise<Array<PolicyReport>> {
  return await store.dispatch('cluster/findAll', { type: WG_POLICY_K8S.POLICY_REPORT.TYPE }, { root: true });
}

/**
 * Filters PolicyReports to return a summary of the report determined by the scope.
 * @param store
 * @param resource
 * @returns `PolicyReportSummary | null | void`
 */
export function getFilteredSummary(store: Store<any>, resource: any): PolicyReportSummary | null | void {
  const schema = store.getters['cluster/schemaFor'](resource.type);

  if ( schema ) {
    const reports = store.getters['kubewarden/policyReports'];

    if ( !isEmpty(reports) ) {
      let filtered: PolicyReportResult[] | undefined;

      // Find the report that is scoped to the resource name
      if ( Array.isArray(reports) && reports.length ) {
        reports.forEach((report: any) => {
          if ( report.metadata?.labels?.['app.kubernetes.io/managed-by'] === 'kubewarden' && report.scope?.uid === resource.metadata?.uid ) {
            filtered = report.results;
          }
        });
      }

      if ( !isEmpty(filtered) ) {
        const out: PolicyReportSummary = {
          pass:  0,
          fail:  0,
          warn:  0,
          error: 0,
          skip:  0
        };

        filtered?.forEach((r: PolicyReportResult) => {
          const resultVal = r.result;

          if ( resultVal ) {
            (out as any)[resultVal]++;
          }
        });

        return out;
      }
    }
  }
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
      const reports:any = await getPolicyReports(store);

      if ( !isEmpty(reports) ) {
        let outReports: PolicyReport[] = [];

        // If the resource is of type `namespace`, return the all reports for the ns
        if ( resource?.type === 'namespace' ) {
          if ( Array.isArray(reports) ) {
            outReports = reports.filter((report: PolicyReport) => report.scope?.namespace === resource?.name);
          }
        } else {
          outReports = reports;
        }

        const outResults: PolicyReportResult[] = [];

        // Find the report that is scoped to the resource name
        if ( Array.isArray(outReports) ) {
          if ( resource?.type === 'namespace' ) {
            outReports.forEach((report: any) => {
              report.results?.forEach((result: any) => {
                outResults.push({
                  ...result,
                  scope:      report.scope,
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
        }

        return outResults;
      }
    } catch (e) {
      console.warn(`Error fetching PolicyReports: ${ e }`); // eslint-disable-line no-console
    }
  }
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