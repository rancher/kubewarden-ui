import { V1LabelSelectorRequirement } from '@kubernetes/client-node';
import { Policy } from './kubewarden';

export interface PolicyChart {
  name: string;
  home: string;
  version: string;
  description: string;
  keywords: string[];
  icon: string;
  apiVersion: string;
  appVersion: string;
  annotations: {
    [key: string]: string | undefined;
  };
  kubeVersion: string;
  type: string;
  urls: string[];
  created: string;
  digest: string;
  key: string;
  repoType: string;
  repoName: string;
  official?: boolean;
}

export interface PolicyDetail {
  readme: string;
  values: {
    metadata?: {
      name: string;
    }
    clusterScoped: boolean;
    spec: Policy['spec'];
  };
  questions: {
    questions: [];
  };
  chart: PolicyChart;
}

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
    matchConditions:   [],
    mutating:          false,
    namespaceSelector: {
      matchExpressions: [],
      matchLabels:      {}
    },
    settings: {}
  }
};

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


export const KUBEWARDEN_POLICY_ANNOTATIONS = {
  CONTEXT_AWARE_RESOURCES:  'kubewarden/contextAwareResources',
  DISPLAY_NAME:             'kubewarden/displayName',
  MUTATION:                 'kubewarden/mutation',
  RESOURCES:                'kubewarden/resources',
  HIDDEN_UI:                'kubewarden/hidden-ui',
  KEYWORDS:                 'kubewarden/keywords',
};

export const LEGACY_POLICY_ANNOTATIONS = {
  DISPLAY_NAME:             'io.artifacthub.displayName',
  KEYWORDS:                 'io.artifacthub.keywords',
  RESOURCES:                'io.artifacthub.resources',
};

