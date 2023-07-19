export const METRICS_DASHBOARD = {
  POLICY_SERVER: 'kubewarden-dashboard-policyserver',
  POLICY:        'kubewarden-dashboard-policy'
};

export const GRAFANA_DASHBOARD_ANNOTATIONS = {
  'meta.helm.sh/release-name':      'rancher-monitoring',
  'meta.helm.sh/release-namespace': 'cattle-monitoring-system',
};

export const GRAFANA_DASHBOARD_LABELS = {
  app:                            'rancher-monitoring-grafana',
  'app.kubernetes.io/instance':   'rancher-monitoring',
  'app.kubernetes.io/managed-by': 'Helm',
  'app.kubernetes.io/part-of':    'rancher-monitoring',
  'app.kubernetes.io/version':    '101.0.0_up19.0.3',
  chart:                          'rancher-monitoring-101.0.0_up19.0.3',
  grafana_dashboard:              '1',
  heritage:                       'Helm',
  release:                        'rancher-monitoring',
  'kubewarden/part-of':           'cattle-kubewarden-system',
};
