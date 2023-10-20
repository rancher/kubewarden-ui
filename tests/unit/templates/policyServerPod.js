export default {
  id:         'cattle-kubewarden-system/policy-server-default-7f59869c46-wjg4v',
  type:       'pod',
  apiVersion: 'v1',
  kind:       'Pod',
  metadata:   {
    labels: {
      app:                         'kubewarden-policy-server-default',
      'kubewarden/policy-server':  'default',
    },
    name:            'policy-server-default-7f59869c46-wjg4v',
    namespace:       'cattle-kubewarden-system',
    state:           {
      error:         false,
      message:       '',
      name:          'running',
      transitioning: false
    },
  },
  spec:   {},
  status: {
    containerStatuses: [
      {
        containerID:  'containerd://e40f74cca010a6c53e393ecb3d5090086910537641c8472606b02f46ea983391',
        image:        'ghcr.io/kubewarden/policy-server:v1.8.0',
        imageID:      'ghcr.io/kubewarden/policy-server@sha256:2d15389fbba5c1534f27011d8632f519a911086c3f08ff1b98f85ad35b246f3f',
        lastState:    {},
        name:         'policy-server-default',
        ready:        true,
        restartCount: 0,
        started:      true,
        state:        { running: { startedAt: '2023-10-20T12:37:41Z' } }
      }
    ],
  }
};