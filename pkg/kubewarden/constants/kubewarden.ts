export const KUBEWARDEN_PRODUCT_NAME = 'kubewarden';
export const KUBEWARDEN_PRODUCT_GROUP = 'policies.kubewarden.io';

export const KUBEWARDEN_MENU = {
  DASHBOARD: 'dashboard',
  POLICY:    'policy'
};

export const CHART_NAME = 'rancher-kubewarden';

export const KUBEWARDEN_DASHBOARD = 'dashboard';

export const KUBEWARDEN_REPOS = {
  CHARTS:                   'https://charts.kubewarden.io',
  CHARTS_REPO:              'https://github.com/kubewarden/helm-charts',
  CHARTS_REPO_GIT:          'https://github.com/kubewarden/helm-charts.git',
  CHARTS_REPO_NAME:         'kubewarden-charts',
  POLICY_CATALOG:           'https://kubewarden.github.io/policy-catalog',
  POLICY_CATALOG_REPO:      'https://github.com/kubewarden/policy-catalog',
  POLICY_CATALOG_REPO_GIT:  'https://github.com/kubewarden/policy-catalog.git',
  POLICY_CATALOG_REPO_NAME: 'kubewarden-policy-catalog',
};
export const KUBEWARDEN_REPO = 'https://charts.kubewarden.io';
export const REGO_POLICIES_REPO = 'https://github.com/kubewarden/rego-policies-library';

export const KUBEWARDEN_CHARTS = {
  CONTROLLER:       'kubewarden-controller',
  DEFAULTS:         'kubewarden-defaults',
};

export const KUBEWARDEN_APPS = {
  RANCHER_CONTROLLER: 'rancher-kubewarden-controller',
  RANCHER_DEFAULTS:   'rancher-kubewarden-defaults'
};

export const KUBEWARDEN_LABELS = { POLICY_SERVER: 'kubewarden/policy-server' };

export const KUBEWARDEN_ANNOTATIONS = {
  CHART_KEY:     'kubewarden.io/chart-key',
  CHART_NAME:    'kubewarden.io/chart-name',
  CHART_VERSION: 'kubewarden.io/chart-version',
};

export const KUBEWARDEN_CATALOG_ANNOTATIONS = {
  CONTEXT_AWARE_RESOURCES: 'kubewarden/contextAwareResources',
  DISPLAY_NAME:            'kubewarden/displayName',
  MUTATION:                'kubewarden/mutation',
  REGISTRY:                'kubewarden/registry',
  REPOSITORY:              'kubewarden/repository',
  RESOURCES:               'kubewarden/resources',
  RULES:                   'kubewarden/rules',
  TAG:                     'kubewarden/tag'
};

export const KUBEWARDEN = {
  ADMISSION_POLICY:               'policies.kubewarden.io.admissionpolicy',
  CLUSTER_ADMISSION_POLICY:       'policies.kubewarden.io.clusteradmissionpolicy',
  POLICY_SERVER:                  'policies.kubewarden.io.policyserver',
  CLUSTER_ADMISSION_POLICY_GROUP: 'policies.kubewarden.io.clusteradmissionpolicygroup',
  ADMISSION_POLICY_GROUP:         'policies.kubewarden.io.admissionpolicygroup'
};
