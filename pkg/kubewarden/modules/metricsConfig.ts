import isEmpty from 'lodash/isEmpty';
import { MONITORING } from '@shell/config/types';

import type { PolicyServer, ServiceMonitorConfigured } from '@kubewarden/types';
import { KUBEWARDEN, MonitoringConfig, ServiceMonitor, ServiceMonitorConfig } from '@kubewarden/types';

import { handleGrowl, GrowlConfig } from '@kubewarden/utils/handle-growl';
import { isPolicyServerResource } from '@kubewarden/modules/policyServer';

/**
 * Determines if the Monitoring App is configured correctly with the namespace and label selectors for
 * the Kubewarden controller and policy servers.
 * @param config `serviceMonitorSpec, controllerApp, policyServerSvcs` | Needs monitoring app service monitor spec,
 * kubewarden controller app, and the policy server services.
 * @returns `boolean` | `true` if configured correctly
 */
export function monitoringIsConfigured(config: MonitoringConfig): boolean {
  const configured = serviceMonitorsConfigured(config);

  if (Array.isArray(configured)) {
    return configured?.some((c: ServiceMonitorConfigured) => {
      const selectorsConfigured = !isEmpty(c?.selectors) && c?.selectors?.some((selector) => {
        for (const key in selector) {
          if (selector[key] && selector[key] === true) {
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

  if (serviceMonitorSpec) {
    return serviceMonitorSpec?.map((sm) => {
      const configured: ServiceMonitorConfigured = {
        namespace: false,
        selectors: []
      };

      /** Find a matching namespaceSelector to the controllerApp */
      if (!isEmpty(controllerApp)) {
        const hasNamespace: boolean = sm.namespaceSelector?.matchNames?.includes(controllerApp?.metadata?.namespace) || false;

        configured.namespace = hasNamespace;
      }

      /** Find matching label selectors for policy server services */
      if (!isEmpty(policyServerSvcs)) {
        policyServerSvcs.forEach((svc) => {
          if (sm.selector?.matchLabels) {
            for (const key of Object.keys(sm.selector.matchLabels)) {
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
 * Searches provided ServiceMonitors for a matching resource.
 *
 * It checks the labels under `spec.selector.matchLabels` for:
 * - The legacy label: `app=kubewarden-policy-server-<policyServerName>`
 * - The new strict labels as described.
 *
 * @param {Object} config - An object containing:
 *        { policyObj?, policyServerObj?, allServiceMonitors }.
 *        Needs either a policy object or policy server object with all fetched ServiceMonitors.
 * @returns {Object|undefined} The matching ServiceMonitor if found.
 */
export function findServiceMonitor(config: ServiceMonitorConfig): ServiceMonitor | undefined {
  const { policyObj, policyServerObj, allServiceMonitors } = config;

  if (!isEmpty(allServiceMonitors)) {
    const policyServerName = policyObj ? policyObj.spec?.policyServer : policyServerObj?.id;

    return allServiceMonitors?.find((sm: ServiceMonitor) => {
      // For ServiceMonitors, labels are under spec.selector.matchLabels
      const labels = sm?.spec?.selector?.matchLabels;

      return isPolicyServerResource(labels, policyServerName as string);
    });
  }
}

/**
 * Creates a Service Monitor for a PolicyServer when provided either a PS or a policy
 * @param config: `store, policyObj?, policyServerObj?, controllerNs` | Needs kubewarden-controller app namespace, either a policy server or policy.
 */
export async function addKubewardenServiceMonitor(config: ServiceMonitorConfig): Promise<void> {
  const {
    store, policyObj, controllerNs, serviceMonitor
  } = config;
  let { policyServerObj } = config;

  if (!serviceMonitor && store.getters['cluster/schemaFor'](MONITORING.SERVICEMONITOR)) {
    // Fetch the policy server object if not provided to determine the labels necessary for the service monitor
    if (!policyServerObj && policyObj && store.getters['cluster/schemaFor'](KUBEWARDEN.POLICY_SERVER)) {
      const policyServer = await store.dispatch(
        'cluster/find',
        {
          type: KUBEWARDEN.POLICY_SERVER,
          id:   policyObj.spec?.policyServer
        }
      );

      if (policyServer) {
        policyServerObj = policyServer as PolicyServer;
      }
    }

    const policyServerID = policyObj ? policyObj.spec?.policyServer : policyServerObj?.id as string;
    const defaultLabels = {
      'app.kubernetes.io/instance':   `policy-server-${ policyServerID }`,
      'app.kubernetes.io/component':  'policy-server',
      'app.kubernetes.io/part-of':    'kubewarden'
    };
    let labels;

    if (policyServerObj?.metadata?.labels && policyServerObj?.metadata?.labels['app']) {
      labels = { app: policyServerObj?.metadata?.labels['app'] };
    } else {
      labels = defaultLabels;
    }

    const serviceMonitorTemplate: ServiceMonitor = {
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      type:       MONITORING.SERVICEMONITOR,
      metadata:   {
        name:        'kubewarden',
        namespace:   controllerNs
      },
      spec: {
        endpoints:         [{
          interval: '10s',
          port:     'metrics'
        }],
        namespaceSelector: { matchNames: [controllerNs] },
        selector:          { matchLabels: labels }
      }
    };

    const serviceMonitorObj = await store.dispatch(
      'cluster/create',
      serviceMonitorTemplate
    );

    try {
      await serviceMonitorObj.save();
    } catch (e) {
      handleGrowl({
        error: e as GrowlConfig | any,
        store
      });
    }
  }
}

/**
 * Returns `true` if the ServiceMonitor is missing the matching label style
 * of the PolicyServer. In other words, if the PolicyServer is new-style
 * but the SM only has old-style (or no) labels, or vice versa, then it’s out of date.
 */
export function isServiceMonitorOutOfDate(ps: PolicyServer, sm: ServiceMonitor): boolean {
  if (!ps || !sm) {
    return false;
  }

  const psLabels = ps.metadata?.labels || {};
  const smLabels = sm.spec?.selector?.matchLabels || {};
  const psName = ps.metadata?.name || ps.id;

  const newLabels = {
    'app.kubernetes.io/instance':  `policy-server-${ ps.metadata?.name }`,
    'app.kubernetes.io/component': 'policy-server',
    'app.kubernetes.io/part-of':   'kubewarden'
  };

  const psIsNewStyle =
    psLabels['app.kubernetes.io/instance']  === newLabels['app.kubernetes.io/instance']  &&
    psLabels['app.kubernetes.io/component'] === newLabels['app.kubernetes.io/component'] &&
    psLabels['app.kubernetes.io/part-of']   === newLabels['app.kubernetes.io/part-of'];

  if (psIsNewStyle) {
    const smHasNewLabels =
      smLabels['app.kubernetes.io/instance']  === newLabels['app.kubernetes.io/instance']  &&
      smLabels['app.kubernetes.io/component'] === newLabels['app.kubernetes.io/component'] &&
      smLabels['app.kubernetes.io/part-of']   === newLabels['app.kubernetes.io/part-of'];

    return !smHasNewLabels;
  }

  const smHasOldStyle = smLabels.app === `kubewarden-policy-server-${ psName }`;

  return !smHasOldStyle;
}

