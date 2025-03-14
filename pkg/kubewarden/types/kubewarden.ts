import {
  V1SecurityContext,
  V1PodSecurityContext,
  V1ObjectMeta,
  V1EnvVar,
  V1LabelSelector,
  V1Condition,
  V1MatchCondition
} from '@kubernetes/client-node';

export const KUBEWARDEN_PRODUCT_NAME = 'kubewarden';
export const KUBEWARDEN_PRODUCT_GROUP = 'policies.kubewarden.io';

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
  ADMISSION_POLICY:         'policies.kubewarden.io.admissionpolicy',
  CLUSTER_ADMISSION_POLICY: 'policies.kubewarden.io.clusteradmissionpolicy',
  POLICY_SERVER:            'policies.kubewarden.io.policyserver'
};

/* eslint-disable no-unused-vars */
export enum KUBEWARDEN_CRD {
  ADMISSION_POLICY = 'admissionpolicies.policies.kubewarden.io',
  CLUSTER_ADMISSION_POLICY = 'clusteradmissionpolicies.policies.kubewarden.io',
  POLICY_SERVER = 'policyservers.policies.kubewarden.io'
}
/* eslint-enable no-unused-vars */

export interface Rule {
  apiGroups: string[];
  apiVersions: string[];
  operations: string[];
  resources: string[];
}

export interface ContextAwareResource {
  apiVersion: string;
  kind: string;
}

export interface PolicyServer {
  id: string;
  type: string;
  links?: {
    remove?: string;
    self?: string;
    update?: string;
    view?: string;
  };
  apiVersion: string;
  kind: string;
  metadata: V1ObjectMeta;
  spec: {
    env: V1EnvVar[];
    image?: string;
    replicas?: number;
    securityContexts?: {
      container?: V1SecurityContext;
      pod?: V1PodSecurityContext;
    };
    serviceAccountName?: string;
  };
  status: {
    conditions: Array<V1Condition>;
  };
}

export interface Policy {
  id?: string;
  type?: string;
  links?: {
    remove?: string;
    self?: string;
    update?: string;
    view?: string;
  };
  apiVersion: string;
  kind: string;
  metadata: V1ObjectMeta;
  spec: {
    backgroundAudit?: boolean;
    contextAwareResources?: ContextAwareResource[];
    failurePolicy?: string;
    matchConditions?: V1MatchCondition[];
    matchPolicy?: string;
    mode?: string;
    module: string;
    mutating?: boolean;
    namespaceSelector?: V1LabelSelector;
    objectSelector?: V1LabelSelector;
    policyServer: string;
    rules: Array<Rule>;
    settings?: any;
    sideEffects?: string;
    timeoutSeconds?: number;
  };
  status?: {
    conditions: Array<V1Condition>;
    mode: string;
    policyStatus: string;
  }
}
