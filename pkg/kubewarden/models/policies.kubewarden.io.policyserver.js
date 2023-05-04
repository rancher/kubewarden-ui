import PolicyServerModel from '../plugins/policy-server-class';

export const DEFAULT_POLICY_SERVER = {
  apiVersion: 'policies.kubewarden.io/v1alpha2',
  kind:       'PolicyServer',
  metadata:   {
    annotations: {},
    labels:      {},
    name:        ''
  },
  spec:       {
    annotations: {},
    env:         [
      { name: 'KUBEWARDEN_LOG_FMT', value: 'otlp' },
      { name: 'KUBEWARDEN_LOG_LEVEL', value: 'info' }
    ],
    image:              'ghcr.io/kubewarden/policy-server:latest',
    replicas:           1,
    serviceAccountName: '',
    verificationConfig: '',
    insecureSources:    [],
    sourceAuthorities:  {}
  }
};

export default class PolicyServer extends PolicyServerModel {}
