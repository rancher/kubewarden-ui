import { Policy, RANCHER_NAMESPACES } from '@kubewarden/types';

export const containerResourcesPolicy: Policy = {
  id:         'container-resources-policy',
  type:       'policies.kubewarden.io.clusteradmissionpolicy',
  apiVersion: 'policies.kubewarden.io/v1',
  kind:       'ClusterAdmissionPolicy',
  metadata:   {
    annotations: { 'artifacthub/pkg': 'container-resources/container-resources/0.1.0' },
    name:        'container-resources-policy',
    labels:      {}
  },
  spec: {
    backgroundAudit:   true,
    mode:              'protect',
    module:            'ghcr.io/kubewarden/policies/container-resources:v0.1.0',
    mutating:          true,
    namespaceSelector: {
      matchExpressions: [
        {
          key:      'kubernetes.io/metadata.name',
          operator: 'NotIn',
          values:   RANCHER_NAMESPACES
        }
      ]
    },
    policyServer: 'default',
    rules:        [
      {
        apiGroups: [
          ''
        ],
        apiVersions: [
          'v1'
        ],
        operations: [
          'CREATE'
        ],
        resources: [
          'pods'
        ]
      },
      {
        apiGroups: [
          ''
        ],
        apiVersions: [
          'v1'
        ],
        operations: [
          'CREATE',
          'UPDATE'
        ],
        resources: [
          'replicationcontrollers'
        ]
      },
      {
        apiGroups: [
          'apps'
        ],
        apiVersions: [
          'v1'
        ],
        operations: [
          'CREATE',
          'UPDATE'
        ],
        resources: [
          'deployments',
          'replicasets',
          'statefulsets',
          'daemonsets'
        ]
      },
      {
        apiGroups: [
          'batch'
        ],
        apiVersions: [
          'v1'
        ],
        operations: [
          'CREATE',
          'UPDATE'
        ],
        resources: [
          'jobs',
          'cronjobs'
        ]
      }
    ],
    timeoutSeconds: 10
  }
};

export const userGroupPolicy: Policy = {
  apiVersion: 'policies.kubewarden.io/v1',
  kind:       'ClusterAdmissionPolicy',
  metadata:   {
    annotations: {
      'meta.helm.sh/release-name':      'rancher-kubewarden-defaults',
      'meta.helm.sh/release-namespace': 'cattle-kubewarden-system',
    },
    finalizers: ['kubewarden'],
    generation: 1,
    labels:     {
      'app.kubernetes.io/component':  'policy',
      'app.kubernetes.io/instance':   'rancher-kubewarden-defaults',
      'app.kubernetes.io/managed-by': 'Helm',
      'app.kubernetes.io/name':       'kubewarden-defaults',
      'app.kubernetes.io/part-of':    'kubewarden',
      'app.kubernetes.io/version':    '1.5.4',
      'helm.sh/chart':                'kubewarden-defaults-1.5.4',
    },
    name: 'do-not-run-as-root',
  },
  spec: {
    module:            'ghcr.io/kubewarden/policies/user-group-psp:v0.4.2',
    mutating:          true,
    namespaceSelector: {
      matchExpressions: [
        {
          key:      'kubernetes.io/metadata.name',
          operator: 'NotIn',
          values:   RANCHER_NAMESPACES,
        },
      ],
      matchLabels: {}
    },
    policyServer: 'default',
    rules:        [
      {
        apiGroups:   [''],
        apiVersions: ['v1'],
        operations:  ['CREATE'],
        resources:   ['pods'],
      },
      {
        apiGroups:   [''],
        apiVersions: ['v1'],
        operations:  ['CREATE', 'UPDATE'],
        resources:   ['replicationcontrollers'],
      },
      {
        apiGroups:   ['apps'],
        apiVersions: ['v1'],
        operations:  ['CREATE', 'UPDATE'],
        resources:   ['deployments', 'replicasets', 'statefulsets', 'daemonsets'],
      },
      {
        apiGroups:   ['batch'],
        apiVersions: ['v1'],
        operations:  ['CREATE', 'UPDATE'],
        resources:   ['jobs', 'cronjobs'],
      },
    ],
    settings: {
      run_as_group:        { rule: 'RunAsAny' },
      run_as_user:         { rule: 'MustRunAsNonRoot' },
      supplemental_groups: { rule: 'RunAsAny' },
    },
    timeoutSeconds: 10,
  },
};
