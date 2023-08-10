export const KUBEWARDEN_PRODUCT_NAME = 'kubewarden';
export const KUBEWARDEN_PRODUCT_GROUP = 'policies.kubewarden.io';

export const CHART_NAME = 'rancher-kubewarden';

export const KUBEWARDEN_DASHBOARD = 'dashboard';
export const KUBEWARDEN_REPO = 'https://charts.kubewarden.io';

export const KUBEWARDEN_CHARTS = {
  CONTROLLER:       'kubewarden-controller',
  DEFAULTS:         'kubewarden-defaults',
};

export const KUBEWARDEN_APPS = {
  RANCHER_CONTROLLER: 'rancher-kubewarden-controller',
  RANCHER_DEFAULTS:   'rancher-kubewarden-defaults'
};

export const KUBEWARDEN = {
  ADMISSION_POLICY:         'policies.kubewarden.io.admissionpolicy',
  CLUSTER_ADMISSION_POLICY: 'policies.kubewarden.io.clusteradmissionpolicy',
  POLICY_SERVER:            'policies.kubewarden.io.policyserver',
  POLICY_REPORT:            'wgpolicyk8s.io.policyreport',
  CLUSTER_POLICY_REPORT:    'wgpolicyk8s.io.clusterpolicyreport'
};