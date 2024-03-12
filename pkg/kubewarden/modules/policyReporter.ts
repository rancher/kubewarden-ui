import isEmpty from 'lodash/isEmpty';
import semver from 'semver';
import { randomStr } from '@shell/utils/string';
import {
  KUBEWARDEN, Resource, Severity, Result, PolicyReport, PolicyReportResult, PolicyReportSummary
} from '../types';
import * as coreTypes from '../core/core-resources';
import { createKubewardenRoute } from '../utils/custom-routing';
import { splitGroupKind } from './core';

/**
 * Attempts to fetch PolicyReports by dispatching a findAll against `wgpolicyk8s.io.policyreport`
 * @param store
 * @returns `PolicyReport[] | void` - Scaffolded value of a PolicyReport accomplished by scaffoldPolicyReport()
 */
export async function getPolicyReports(store: any): Promise<PolicyReport[] | void> {
  const schema = store.getters['cluster/schemaFor'](KUBEWARDEN.POLICY_REPORT);

  if ( schema ) {
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

/**
 * Dispatches findAll for PolicyReports (`wgpolicyk8s.io.policyreport`)
 * @param store
 * @returns `PolicyReport[] | void`
 */
export async function fetchPolicyReports(store: any): Promise<Array<PolicyReport>> {
  return await store.dispatch('cluster/findAll', { type: KUBEWARDEN.POLICY_REPORT }, { root: true });
}

/**
 * Filters PolicyReports to return a summary of the results per namespace
 * @param store
 * @param resource
 * @returns `PolicyReportSummary | null | void`
 */
export function getFilteredSummary(store: any, resource: any): PolicyReportSummary | null | void {
  const schema = store.getters['cluster/schemaFor'](resource.type);

  if ( schema ) {
    const reports = store.getters['kubewarden/policyReports'];

    if ( !isEmpty(reports) ) {
      const hasNamespace = resource?.metadata?.namespace;

      if ( hasNamespace ) {
        let filtered: PolicyReportResult[] | undefined;

        // Find the report that is scoped to the resource namespace
        if ( Array.isArray(reports) ) {
          reports.forEach((report: any) => {
            if ( report.scope?.name === resource.metadata.namespace ) {
              const filteredResult = report.results?.filter((result: PolicyReportResult) => {
                const filteredResource = result?.resources?.find((r: Resource) => {
                  const { kind, name, namespace } = r;

                  if ( kind === resource.kind && name === resource.metadata.name && namespace === resource.metadata.namespace ) {
                    return r;
                  }
                });

                if ( !isEmpty(filteredResource) ) {
                  // Assign uid for SortableTable sub-row
                  Object.assign(result, { uid: randomStr() });

                  return result;
                }
              });

              if ( !isEmpty(filteredResult) ) {
                filtered = filteredResult;
              }
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
}

/**
 * Filters PolicyReports for namespaced resources or the Namespace resource type
 * @param store
 * @param resource
 * @returns `PolicyReport | PolicyReportResult[] | null | void`
 */
export async function getFilteredReports(store: any, resource: any): Promise<PolicyReport | PolicyReportResult[] | null | void> {
  const schema = store.getters['cluster/schemaFor'](resource.type);

  if ( schema ) {
    try {
      const reports = await getPolicyReports(store);

      if ( !isEmpty(reports) ) {
        const hasNamespace = resource?.metadata?.namespace;

        // If the resource is a namespace, return the all reports for the ns
        if ( resource?.type === 'namespace' ) {
          let out: PolicyReport | undefined | null = null;

          if ( Array.isArray(reports) ) {
            out = reports.find((report: PolicyReport) => report.scope?.name === resource?.name);
          }

          if ( !isEmpty(out) ) {
            // Assign uid for SortableTable sub-row
            out.results?.forEach((result: any) => {
              Object.assign(result, { uid: randomStr() });
            });

            return out;
          }
        }

        if ( hasNamespace ) {
          let out: PolicyReportResult[] | null = null;

          // Find the report that is scoped to the resource namespace
          if ( Array.isArray(reports) ) {
            reports.forEach((report: any) => {
              if ( report.scope?.name === resource.metadata.namespace ) {
                const filteredResult = report.results?.filter((result: PolicyReportResult) => {
                  const filteredResource = result?.resources?.find((r: Resource) => {
                    const { kind, name, namespace } = r;

                    if ( kind === resource.kind && name === resource.metadata.name && namespace === resource.metadata.namespace ) {
                      return r;
                    }
                  });

                  if ( !isEmpty(filteredResource) ) {
                    // Assign uid for SortableTable sub-row
                    Object.assign(result, { uid: randomStr() });

                    return result;
                  }
                });

                if ( !isEmpty(filteredResult) ) {
                  out = filteredResult;
                }
              }
            });
          }

          return out;
        }
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
export function getLinkForPolicy(store: any, report: PolicyReportResult): Object | void {
  if ( report?.policy ) {
    const apSchema = store.getters['cluster/schemaFor'](KUBEWARDEN.ADMISSION_POLICY);
    const capSchema = store.getters['cluster/schemaFor'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY);

    /**
     * Split policy name as it is formatted like: 'cap-do-not-run-as-root'
     * To determine which type of policy we need the first part of the string,
     * 'cap' or 'ap' for ClusterAdmissionPolicy and AdmissionPolicy respectively.
     */
    let policyType: string = '';
    let policyParts: string[] = report.policy.split('-');
    let policyNs: string | null = null;

    if ( policyParts.length >= 2 ) {
      policyParts = [policyParts[0], policyParts.slice(1).join('-')];
      policyType = policyParts[0] === 'cap' ? KUBEWARDEN.CLUSTER_ADMISSION_POLICY : KUBEWARDEN.ADMISSION_POLICY;

      // Find the namespace of the AdmissionPolicy
      if ( policyType === KUBEWARDEN.ADMISSION_POLICY && apSchema ) {
        const admissionPolicies = store.getters['cluster/all'](KUBEWARDEN.ADMISSION_POLICY);
        const resource = admissionPolicies?.find((ap: any) => ap.metadata?.name === policyParts[1]);

        if ( resource ) {
          policyNs = resource.metadata?.namespace;
        }
      }
    }

    if ( policyType === KUBEWARDEN.ADMISSION_POLICY && apSchema ) {
      return createKubewardenRoute({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource: policyType, id: policyParts[1], namespace: policyNs
        }
      });
    }

    if ( policyType === KUBEWARDEN.CLUSTER_ADMISSION_POLICY && capSchema ) {
      return createKubewardenRoute({
        name:   'c-cluster-product-resource-id',
        params: { resource: policyType, id: policyParts[1] }
      });
    }
  }
}

/**
 * Finds the resource link from a policy report for a Namespace's tab component. Since the `type` is
 * not passed in from the report, it needs to be determined by the `kind` of the resource. For core
 * resources this works as is, but for non-core resources (e.g. `apps.deployments`), this is extrapolated
 * by the `apiVersion` combined with the `kind`.
 * @param report: `PolicyReportResult
 * @returns `Route | void`
 */
export function getLinkForResource(report: PolicyReportResult): Object | void {
  if ( !isEmpty(report.resources?.[0]) ) {
    const resource = report.resources?.[0];

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
  uiPluginVersion = '1.4.0';
  if (semver.gte(uiPluginVersion, '1.4.0')) {
    return {
      oldSPolicyReports: semver.gte(controllerAppVersion, '1.11.0'),
      newPolicyReports:  true
    };
  }

  if (semver.lt(uiPluginVersion, '1.4.0')) {
    return {
      oldSPolicyReports: true,
      newPolicyReports:  semver.lte(controllerAppVersion, '1.10.0')
    };
  }

  return {
    oldSPolicyReports: true,
    newPolicyReports:  true
  };
}