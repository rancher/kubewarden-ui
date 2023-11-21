import isEmpty from 'lodash/isEmpty';
import { MONITORING } from '@shell/config/types';

import { CatalogApp, Service, ServiceMonitor, ServiceMonitorSpec } from '../types';
import { handleGrowl, GrowlConfig } from '../utils/handle-growl';

type ServiceMonitorConfigured = {
  namespace: boolean,
  selectors?: {[key: string]: boolean}[];
}

interface MonitoringConfig {
  serviceMonitorSpec: ServiceMonitorSpec[],
  controllerApp: CatalogApp,
  policyServerSvcs: Service[]
}

interface ServiceMonitorConfig {
  store: any,
  policyObj?: any,
  policyServerObj?: any,
  controllerNs: string,
  allServiceMonitors?: ServiceMonitor[]
  serviceMonitor?: ServiceMonitor
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

/**
 * Searches provided ServiceMonitors for a matching resource based on the `selector.matchLabels` including:
 * `app=kubewarden-policy-server-<policy-server-id>`
 * @param config: `policyObj?, policyServerObj?, allServiceMonitors` | Needs either a policy object or policy server object with all fetched
 * ServiceMonitors
 * @returns `ServiceMonitor | void`
 */
export function findServiceMonitor(config: ServiceMonitorConfig): ServiceMonitor | void {
  const { policyObj, policyServerObj, allServiceMonitors } = config;

  if ( !isEmpty(allServiceMonitors) ) {
    const smName: string = policyObj ? policyObj.spec?.policyServer : policyServerObj?.id;

    return allServiceMonitors?.find(sm => sm?.spec?.selector?.matchLabels?.['app'] === `kubewarden-policy-server-${ smName }`);
  }
}

/**
 * Creates a Service Monitor for a PolicyServer when provided either a PS or a policy
 * @param config: `store, policyObj?, policyServerObj?, controllerNs` | Needs kubewarden-controller app namespace, either a policy server or policy.
 */
export async function addKubewardenServiceMonitor(config: ServiceMonitorConfig): Promise<void> {
  const {
    store, policyObj, policyServerObj, controllerNs, serviceMonitor
  } = config;

  if ( store.getters['cluster/schemaFor'](MONITORING.SERVICEMONITOR) ) {
    const smName: string = policyObj ? policyObj.spec?.policyServer : policyServerObj?.id;

    const serviceMonitorTemplate: ServiceMonitor = {
      kind:     'ServiceMonitor',
      type:     MONITORING.SERVICEMONITOR,
      metadata: {
        name:        smName,
        namespace:   controllerNs
      },
      spec: {
        endpoints:         [{ interval: '10s', port: 'metrics' }],
        namespaceSelector: { matchNames: [controllerNs] },
        selector:          { matchLabels: { app: `kubewarden-policy-server-${ smName }` } }
      }
    };

    if ( !serviceMonitor ) {
      const serviceMonitorObj = await store.dispatch(
        'cluster/create',
        serviceMonitorTemplate
      );

      try {
        await serviceMonitorObj.save();
      } catch (e) {
        handleGrowl({ error: e as GrowlConfig | any, store });
      }
    }
  }
}