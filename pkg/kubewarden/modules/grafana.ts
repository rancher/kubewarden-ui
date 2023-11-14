import isEmpty from 'lodash/isEmpty';

import { CONFIG_MAP, SERVICE } from '@shell/config/types';

import {
  CatalogApp,
  KubewardenDashboards,
  KubewardenDashboardLabels,
  GrafanaDashboardLabels,
  GrafanaDashboardAnnotations,
  HelmAnnotations
} from '../types';
import { handleGrowl, GrowlConfig } from '../utils/handle-growl';

interface MetricsConfig {
  store: any,
  type: string
}

interface DashboardConfig {
  store: any,
  monitoringApp: CatalogApp,
  controllerApp: CatalogApp
}

export async function grafanaProxy(config: MetricsConfig): Promise<any> {
  const { store, type } = config;

  try {
    const grafana = await grafanaService(store);

    if ( !isEmpty(grafana) ) {
      const base = `/api/v1/namespaces/${ grafana.metadata.namespace }/services`;
      const proxy = `/http:${ grafana.metadata.name }:80/proxy`;
      const path = `/d/${ type }?orgId=1&kiosk`;

      return base + proxy + path;
    }
  } catch (e) {
    handleGrowl({
      error: e as GrowlConfig | any, store, type: 'warning'
    });
  }

  return null;
}

export async function grafanaService(store: any) {
  try {
    return await store.dispatch('cluster/find', {
      type: SERVICE,
      id:   'cattle-monitoring-system/rancher-monitoring-grafana'
    }, { root: true });
  } catch (e) {
    handleGrowl({
      error: e as GrowlConfig | any, store, type: 'warning'
    });
  }
}

export async function findKubewardenDashboards(store: any) {
  try {
    return await store.dispatch('cluster/findMatching', {
      type:     CONFIG_MAP,
      selector: `kubewarden/part-of=cattle-kubewarden-system`
    });
  } catch (e) {
    handleGrowl({
      error: e as GrowlConfig | any, store, type: 'warning'
    });
  }
}

/**
   * Creates a ConfigMap for the Grafana dashboard depending on the type supplied
   * @param `store, type` | Type of resource ( PolicyServer || (Cluster)AdmissionPolicy )
   */
export async function addKubewardenDashboards(config: DashboardConfig): Promise<void> {
  const { store, monitoringApp, controllerApp } = config;

  if ( monitoringApp && controllerApp ) {
    /**
     * There are 2 dashboards for Kubewarden:
     * PolicyServer is the default one copied from https://grafana.com/grafana/dashboards/15314-kubewarden/
     * Policies have a condensed version
    */
    const dashboardEnums = Object.values(KubewardenDashboards);

    for ( const type of dashboardEnums ) {
      const file = await import(/* webpackChunkName: "policyDashboard" */ `../assets/${ type }.json`);
      const fileKey = `${ type }.json`;

      /** Check for existing configmaps */
      const existing = await findKubewardenDashboards(store);

      if ( existing && existing?.metadata?.name === type ) {
        return;
      }

      const labels: GrafanaDashboardLabels = {
        [KubewardenDashboardLabels.DASHBOARD]:         type,
        [KubewardenDashboardLabels.PART_OF]:           controllerApp.metadata.namespace,
        [KubewardenDashboardLabels.APP]:               'rancher-monitoring-grafana',
        [KubewardenDashboardLabels.GRAFANA_DASHBOARD]: '1',
        'app.kubernetes.io/instance':                  monitoringApp.metadata.name
      };

      const annotations: GrafanaDashboardAnnotations = {
        [HelmAnnotations.NAME]:      monitoringApp.metadata.name,
        [HelmAnnotations.NAMESPACE]: monitoringApp.metadata.namespace
      };

      const configMapTemplate = await store.dispatch(
        'cluster/create',
        {
          type:     CONFIG_MAP,
          metadata: {
            annotations,
            labels,
            name:        type,
            namespace:   'cattle-dashboards',
          },
          data: { [fileKey]: JSON.stringify(file) },
        }
      );

      try {
        await configMapTemplate.save();
      } catch (e) {
        handleGrowl({ error: e as GrowlConfig | any, store });
      }
    }
  }
}