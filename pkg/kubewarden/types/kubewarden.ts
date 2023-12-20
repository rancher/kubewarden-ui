import { Condition, Metadata } from './core';

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

export const KUBEWARDEN_LABELS = { POLICY_SERVER: 'kubewarden/policy-server' };

export const KUBEWARDEN = {
  ADMISSION_POLICY:         'policies.kubewarden.io.admissionpolicy',
  CLUSTER_ADMISSION_POLICY: 'policies.kubewarden.io.clusteradmissionpolicy',
  POLICY_SERVER:            'policies.kubewarden.io.policyserver',
  POLICY_REPORT:            'wgpolicyk8s.io.policyreport',
  CLUSTER_POLICY_REPORT:    'wgpolicyk8s.io.clusterpolicyreport'
};

/* eslint-disable no-unused-vars */
export enum KUBEWARDEN_CRD {
  ADMISSION_POLICY = 'admissionpolicies.policies.kubewarden.io',
  CLUSTER_ADMISSION_POLICY = 'clusteradmissionpolicies.policies.kubewarden.io',
  POLICY_SERVER = 'policyservers.policies.kubewarden.io',
  POLICY_REPORT = 'policyreports.wgpolicyk8s.io',
  CLUSTER_POLICY_REPORT = 'clusterpolicyreports.wgpolicyk8s.io'
}
/* eslint-enable no-unused-vars */

export type Rule = {
  apiGroups: string[],
  apiVersions: string[],
  operations: string[],
  resources: string[]
}

export type PolicyServer = {
  id: string,
  type: string,
  links?: {
    remove?: string,
    self?: string,
    update?: string,
    view?: string
  },
  apiVersion: string,
  kind: string,
  metadata: Metadata,
  spec: {
    env: [
      {
        name: string,
        value: string
      }
    ],
    image?: string,
    replicas?: number,
    securityContexts?: any,
    serviceAccountName?: string
  },
  status: {
    conditions: Array<Condition>
  }
}

export type Policy = {
  id: string,
  type: string,
  links?: {
    remove?: string,
    self?: string,
    update?: string,
    view?: string
  },
  apiVersion: string,
  kind: string,
  metadata: Metadata,
  spec: {
    backgroundAudit?: boolean,
    mode: string,
    module: string,
    mutating?: boolean,
    namespaceSelector?: {
      matchExpressions: [
        {
          key: string,
          operator: string,
          values: string[]
        }
      ]
    },
    policyServer: string,
    rules: Array<Rule>,
    settings?: any,
    timeoutSeconds?: number
  },
  status: {
    conditions: Array<Condition>,
    mode: string,
    policyStatus: string
  }
}
