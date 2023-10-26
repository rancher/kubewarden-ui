import isEmpty from 'lodash/isEmpty';

import { CatalogApp, Service, ServiceMonitorSpec } from '../types';

type ServiceMonitorConfigured = {
  namespace: boolean,
  selectors?: {[key: string]: boolean}[];
}

interface MonitoringConfig {
  serviceMonitorSpec: ServiceMonitorSpec[],
  controllerApp: CatalogApp,
  policyServerSvcs: Service[]
}

/**
 * Determines if the Monitoring App is configured correctly with the namespace and label selectors for
 * the Kubewarden controller and policy servers.
 * @param config `serviceMonitorSpec, controllerApp, policyServerSvcs` | Needs monitoring app service monitor spec,
 * kubewarden controller app, and the policy server services.
 * @returns `boolean` | `true` if configured correctly
 */
export function monitoringIsConfigured(config: MonitoringConfig): boolean {
  const configured = serviceMonitorsConfigured(config);

  if ( Array.isArray(configured) ) {
    return configured?.some((c: ServiceMonitorConfigured) => {
      const selectorsConfigured = !isEmpty(c?.selectors) && c?.selectors?.some((selector) => {
        for (const key in selector) {
          if ( selector[key] && selector[key] === true ) {
            return true;
          }
        }

        return false;
      });

      return c.namespace && selectorsConfigured;
    });
  }

  return false;
}

/**
 * Searchs for matching `namespaceSelector` and `matchLabels` selector between `serviceMonitorSpec`, `controllerApp`, and `policyServerSvcs`
 * @param config `serviceMonitorSpec, controllerApp, policyServerSvcs` | Needs monitoring app service monitor spec,
 * kubewarden controller app, and the policy server services.
 * @returns `ServiceMonitorConfigured[] | boolean` | If `serviceMonitorSpec` is provided, will return a `ServiceMonitorConfigured` object
 * which contains a `namespace` boolean for a match and selectors[] for `matchLabels`
 */
export function serviceMonitorsConfigured(config: MonitoringConfig): ServiceMonitorConfigured[] | boolean {
  const { serviceMonitorSpec, controllerApp, policyServerSvcs } = config;

  if ( serviceMonitorSpec ) {
    return serviceMonitorSpec?.map((sm) => {
      const configured: ServiceMonitorConfigured = {
        namespace: false,
        selectors: []
      };

      /** Find a matching namespaceSelector to the controllerApp */
      if ( !isEmpty(controllerApp) ) {
        const hasNamespace: boolean = sm.namespaceSelector?.matchNames?.includes(controllerApp?.metadata?.namespace) || false;

        configured.namespace = hasNamespace;
      }

      /** Find matching label selectors for policy server services */
      if ( !isEmpty(policyServerSvcs) ) {
        policyServerSvcs.forEach((svc) => {
          if ( sm.selector?.matchLabels ) {
            for ( const key of Object.keys(sm.selector.matchLabels) ) {
              const hasLabel = svc?.metadata?.labels?.[key] && svc.metadata.labels[key] === sm.selector.matchLabels[key];

              configured?.selectors?.push({ [key]: !!hasLabel });
            }
          }
        });
      }

      return configured;
    });
  }

  return false;
}
