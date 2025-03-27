import { PolicyServer } from '@kubewarden/types';

export default <PolicyServer[]>[
  {
    id:    'default',
    type:  'policies.kubewarden.io.policyserver',
    links: {
      remove: 'https://localhost:8005/v1/policies.kubewarden.io.policyservers/default',
      self:   'https://localhost:8005/v1/policies.kubewarden.io.policyservers/default',
      update: 'https://localhost:8005/v1/policies.kubewarden.io.policyservers/default',
      view:   'https://localhost:8005/apis/policies.kubewarden.io/v1/policyservers/default'
    },
    apiVersion: 'policies.kubewarden.io/v1',
    kind:       'PolicyServer',
    metadata:   {
      annotations: {
        'meta.helm.sh/release-name':      'rancher-kubewarden-defaults',
        'meta.helm.sh/release-namespace': 'cattle-kubewarden-system'
      },
      creationTimestamp: '2025-02-21T11:42:01Z',
      finalizers:        [
        'kubewarden.io/finalizer'
      ],
      generation: 1,
      labels:     {
        'app.kubernetes.io/component':  'policy-server',
        'app.kubernetes.io/instance':   'rancher-kubewarden-defaults',
        'app.kubernetes.io/managed-by': 'Helm',
        'app.kubernetes.io/name':       'kubewarden-defaults',
        'app.kubernetes.io/part-of':    'kubewarden',
        'app.kubernetes.io/version':    'v1.21.0',
        'helm.sh/chart':                'kubewarden-defaults-2.8.1'
      },
      name:            'default',
      resourceVersion: '157416',
      state:           {
        error:         false,
        message:       'Resource is current',
        name:          'active',
        transitioning: false
      },
      uid: 'e2f90b41-60b6-412d-956c-617eff095840'
    },
    spec: {
      affinity: {},
      env:      [
        {
          name:  'KUBEWARDEN_LOG_LEVEL',
          value: 'info'
        }
      ],
      image:              'ghcr.io/kubewarden/policy-server:v1.21.1',
      replicas:           1,
      securityContexts:   {},
      serviceAccountName: 'policy-server'
    },
    status: {
      conditions: [
        {
          error:              false,
          lastTransitionTime: '2025-02-21T11:42:01Z',
          lastUpdateTime:     '2025-02-21T11:42:01Z',
          message:            '',
          reason:             'ReconciliationSucceeded',
          status:             'True',
          transitioning:      false,
          type:               'CertSecretReconciled'
        },
        {
          error:              false,
          lastTransitionTime: '2025-02-21T11:42:02Z',
          lastUpdateTime:     '2025-02-21T11:42:02Z',
          message:            '',
          reason:             'ReconciliationSucceeded',
          status:             'True',
          transitioning:      false,
          type:               'ConfigMapReconciled'
        },
        {
          error:              false,
          lastTransitionTime: '2025-02-21T11:42:02Z',
          lastUpdateTime:     '2025-02-21T11:42:02Z',
          message:            '',
          reason:             'ReconciliationSucceeded',
          status:             'True',
          transitioning:      false,
          type:               'PodDisruptionBudgetReconciled'
        },
        {
          error:              false,
          lastTransitionTime: '2025-02-21T11:42:02Z',
          lastUpdateTime:     '2025-02-21T11:42:02Z',
          message:            '',
          reason:             'ReconciliationSucceeded',
          status:             'True',
          transitioning:      false,
          type:               'DeploymentReconciled'
        },
        {
          error:              false,
          lastTransitionTime: '2025-02-21T11:42:02Z',
          lastUpdateTime:     '2025-02-21T11:42:02Z',
          message:            '',
          reason:             'ReconciliationSucceeded',
          status:             'True',
          transitioning:      false,
          type:               'ServiceReconciled'
        }
      ]
    }
  },
  {
    id:    'other',
    type:  'policies.kubewarden.io.policyserver',
    links: {
      remove: 'https://localhost:8005/v1/policies.kubewarden.io.policyservers/other',
      self:   'https://localhost:8005/v1/policies.kubewarden.io.policyservers/other',
      update: 'https://localhost:8005/v1/policies.kubewarden.io.policyservers/other',
      view:   'https://localhost:8005/apis/policies.kubewarden.io/v1/policyservers/other'
    },
    apiVersion: 'policies.kubewarden.io/v1',
    kind:       'PolicyServer',
    metadata:   {
      annotations: {
        'meta.helm.sh/release-name':      'rancher-kubewarden-defaults',
        'meta.helm.sh/release-namespace': 'cattle-kubewarden-system'
      },
      creationTimestamp: '2025-02-21T11:42:01Z',
      finalizers:        [
        'kubewarden.io/finalizer'
      ],
      generation: 1,
      labels:     {
        'app.kubernetes.io/component':  'policy-server',
        'app.kubernetes.io/instance':   'rancher-kubewarden-defaults',
        'app.kubernetes.io/managed-by': 'Helm',
        'app.kubernetes.io/name':       'kubewarden-defaults',
        'app.kubernetes.io/part-of':    'kubewarden',
        'app.kubernetes.io/version':    'v1.21.0',
        'helm.sh/chart':                'kubewarden-defaults-2.8.1'
      },
      name:            'other',
      resourceVersion: '157416',
      state:           {
        error:         false,
        message:       'Resource is current',
        name:          'active',
        transitioning: false
      },
      uid: 'e2f90b41-60b6-412d-956c-617eff095840'
    },
    spec: {
      affinity: {},
      env:      [
        {
          name:  'KUBEWARDEN_LOG_LEVEL',
          value: 'info'
        }
      ],
      image:              'ghcr.io/kubewarden/policy-server:v1.21.1',
      replicas:           1,
      securityContexts:   {},
      serviceAccountName: 'policy-server'
    },
    status: {
      conditions: [
        {
          error:              false,
          lastTransitionTime: '2025-02-21T11:42:01Z',
          lastUpdateTime:     '2025-02-21T11:42:01Z',
          message:            '',
          reason:             'ReconciliationSucceeded',
          status:             'True',
          transitioning:      false,
          type:               'CertSecretReconciled'
        },
        {
          error:              false,
          lastTransitionTime: '2025-02-21T11:42:02Z',
          lastUpdateTime:     '2025-02-21T11:42:02Z',
          message:            '',
          reason:             'ReconciliationSucceeded',
          status:             'True',
          transitioning:      false,
          type:               'ConfigMapReconciled'
        },
        {
          error:              false,
          lastTransitionTime: '2025-02-21T11:42:02Z',
          lastUpdateTime:     '2025-02-21T11:42:02Z',
          message:            '',
          reason:             'ReconciliationSucceeded',
          status:             'True',
          transitioning:      false,
          type:               'PodDisruptionBudgetReconciled'
        },
        {
          error:              false,
          lastTransitionTime: '2025-02-21T11:42:02Z',
          lastUpdateTime:     '2025-02-21T11:42:02Z',
          message:            '',
          reason:             'ReconciliationSucceeded',
          status:             'True',
          transitioning:      false,
          type:               'DeploymentReconciled'
        },
        {
          error:              false,
          lastTransitionTime: '2025-02-21T11:42:02Z',
          lastUpdateTime:     '2025-02-21T11:42:02Z',
          message:            '',
          reason:             'ReconciliationSucceeded',
          status:             'True',
          transitioning:      false,
          type:               'ServiceReconciled'
        }
      ]
    }
  }
];
