/* eslint-disable no-unused-vars */
export enum KubewardenDashboardLabels {
  DASHBOARD = 'kubewarden/dashboard',
  PART_OF = 'kubewarden/part-of',
  APP = 'app',
  GRAFANA_DASHBOARD = 'grafana_dashboard',
}

export enum KubewardenDashboards {
  POLICY_SERVER = 'kubewarden-dashboard-policyserver',
  POLICY = 'kubewarden-dashboard-policy'
}

export enum HelmAnnotations {
  NAME = 'meta.helm.sh/release-name',
  NAMESPACE = 'meta.helm.sh/release-namespace'
}
/* eslint-enable no-unused-vars */

export interface GrafanaDashboardLabels {
  [KubewardenDashboardLabels.DASHBOARD]: string,
  [KubewardenDashboardLabels.PART_OF]: string,
  [KubewardenDashboardLabels.APP]: string,
  [KubewardenDashboardLabels.GRAFANA_DASHBOARD]: string,
  'app.kubernetes.io/instance': string
}

export interface GrafanaDashboardAnnotations {
  [HelmAnnotations.NAME]: string,
  [HelmAnnotations.NAMESPACE]: string
}
