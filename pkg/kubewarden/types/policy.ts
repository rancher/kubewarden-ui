import { V1LabelSelectorRequirement } from '@kubernetes/client-node';
import { Policy, KUBEWARDEN } from './kubewarden';

export const DEFAULT_POLICY: Policy = {
  apiVersion: '',
  kind:       '',
  metadata:   {
    name:      '',
    namespace: ''
  },
  spec:       {
    backgroundAudit: true,
    policyServer:    '',
    module:          '',
    rules:           [{
      apiGroups:   [],
      apiVersions: [],
      resources:   [],
      operations:  []
    }],
    mutating:          false,
    namespaceSelector: {
      matchExpressions: [],
      matchLabels:      {}
    },
    settings: {}
  }
};

export const ARTIFACTHUB_ENDPOINT = 'artifacthub.io/api/v1';

export const ARTIFACTHUB_PKG_ANNOTATION = 'artifacthub/pkg';

export const VALIDATION_KEYS = [
  'allowed',
  'host',
  'kind',
  'mutated',
  'name',
  'namespace',
  'operation',
  'policy_id',
  'response_message',
  'response_code',
];

export const RANCHER_NAMESPACES = [
  'calico-system',
  'cattle-alerting',
  'cattle-fleet-local-system',
  'cattle-fleet-system',
  'cattle-global-data',
  'cattle-global-nt',
  'cattle-impersonation-system',
  'cattle-istio',
  'cattle-logging',
  'cattle-pipeline',
  'cattle-prometheus',
  'cattle-system',
  'cert-manager',
  'ingress-nginx',
  'kube-node-lease',
  'kube-public',
  'kube-system',
  'rancher-operator-system',
  'security-scan',
  'tigera-operator',
];

export const RANCHER_NS_MATCH_EXPRESSION: V1LabelSelectorRequirement = {
  key:      'kubernetes.io/metadata.name',
  operator: 'NotIn',
  values:   RANCHER_NAMESPACES,
};

export const MODE_MAP = {
  monitor: 'bg-info',
  protect: 'bg-warning',
};

export const OPERATION_MAP = {
  '*':     'bg-darker',
  CREATE:  'bg-info',
  UPDATE:  'bg-warning',
  DELETE:  'bg-error',
  CONNECT: 'bg-success',
};

/* eslint-disable no-unused-vars */
export enum VALUES_STATE {
  FORM = 'FORM',
  YAML = 'YAML',
}
/* eslint-enable no-unused-vars */

export const YAML_OPTIONS = [
  {
    labelKey: 'catalog.install.section.chartOptions',
    value:    VALUES_STATE.FORM,
  },
  {
    labelKey: 'catalog.install.section.valuesYaml',
    value:    VALUES_STATE.YAML,
  }
];

export const POLICY_SCHEMA = {
  id:              KUBEWARDEN.SPOOFED.POLICY,
  type:            'schema',
  pluralName:      'policies.kubewarden.io.policies',
  resourceMethods: [
    'GET',
    'DELETE',
    'PUT',
    'PATCH'
  ],
  _resourceFields:        null,
  requiresResourceFields: true,
  collectionMethods:      [
    'GET',
    'POST'
  ],
  attributes: {
    columns: [
      {
        name:  'Policy Server',
        field: '.spec.policyServer',
        type:  'string'
      },
      {
        name:  'Mutating',
        field: '.spec.mutating',
        type:  'boolean'
      },
      {
        name:  'BackgroundAudit',
        field: '.spec.backgroundAudit',
        type:  'boolean'
      },
      {
        name:  'Mode',
        field: '.spec.mode',
        type:  'string'
      },
      {
        name:  'Observed mode',
        field: '.status.mode',
        type:  'string'
      },
      {
        name:  'Status',
        field: '.status.policyStatus',
        type:  'string'
      },
      {
        name:  'Age',
        field: '.metadata.creationTimestamp',
        type:  'date'
      },
      {
        name:  'Severity',
        field: ".metadata.annotations['io\\.kubewarden\\.policy\\.severity']",
        type:  'string'
      },
      {
        name:  'Category',
        field: ".metadata.annotations['io\\.kubewarden\\.policy\\.category']",
        type:  'string'
      }
    ],
    group:      'policies.kubewarden.io',
    kind:       'Policy',
    namespaced: false,
    resource:   'policies',
    verbs:      [
      'delete',
      'deletecollection',
      'get',
      'list',
      'patch',
      'create',
      'update',
      'watch'
    ],
    version: 'v1'
  },
  _id:    KUBEWARDEN.SPOOFED.POLICY,
  _group: 'policies.kubewarden.io'
};
