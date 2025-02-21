export default [
  {
    policyName: 'disallow-np',
    cluster:    'current_cluster',
    traces:     [
      {
        id:              '8bb0ad38f130c28f544491ea03a10b40',
        allowed:         false,
        mode:            'protect',
        name:            'testnp',
        operation:       'CREATE',
        kind:            'Service',
        namespace:       'test',
        startTime:       1697570010372396,
        duration:        5573,
        responseMessage: 'Service of type NodePort are not allowed',
        mutated:         false
      },
      {
        id:              'cebfb79f93dfb265a2eeedde936f5ade',
        allowed:         false,
        mode:            'protect',
        name:            'testnp',
        operation:       'CREATE',
        kind:            'Service',
        namespace:       'test',
        startTime:       1697570013239380,
        duration:        9276,
        responseMessage: 'Service of type NodePort are not allowed',
        mutated:         true
      }
    ]
  },
  {
    policyName: 'do-not-run-as-root',
    cluster:    'current_cluster',
    traces:     [
      {
        id:        '0de3e0c42e65bee1589d712288c50ffc',
        allowed:   false,
        mode:      'monitor',
        name:      'test-dep-55d796bc5c',
        operation: 'CREATE',
        kind:      'ReplicaSet',
        namespace: 'test',
        startTime: 1697570587920061,
        duration:  16537,
        mutated:   false
      },
      {
        id:        'f88795b067495fb6d2853a42ca5608f7',
        allowed:   false,
        mode:      'monitor',
        name:      'test-dep',
        operation: 'CREATE',
        kind:      'Deployment',
        namespace: 'test',
        startTime: 1697570587703025,
        duration:  27631,
        mutated:   false
      },
      {
        id:        '462d09df0b32742afa205f484d86163b',
        allowed:   false,
        mode:      'monitor',
        name:      '',
        operation: 'CREATE',
        kind:      'Pod',
        namespace: 'test',
        startTime: 1697570588020968,
        duration:  48728,
        mutated:   false
      }
    ]
  },
  {
    policyName: 'do-not-share-host-paths',
    cluster:    'current_cluster',
    traces:     [
      {
        id:        '6737aab871b84c88e0d72fe9ccd1c0ad',
        allowed:   false,
        mode:      'monitor',
        name:      'test-dep-55d796bc5c-smc89',
        operation: 'CREATE',
        kind:      'Pod',
        namespace: 'test',
        startTime: 1697570588442452,
        duration:  11675,
        mutated:   false
      }
    ]
  },
  {
    policyName: 'drop-capabilities',
    cluster:    'current_cluster',
    traces:     [
      {
        id:        '6b45b47c049c232930506009ea6e3208',
        allowed:   false,
        mode:      'monitor',
        name:      '',
        operation: 'CREATE',
        kind:      'Pod',
        namespace: 'test',
        startTime: 1697570588115481,
        duration:  23975,
        mutated:   false
      }
    ]
  },
  {
    policyName: 'no-host-namespace-sharing',
    cluster:    'current_cluster',
    traces:     [
      {
        id:        '1032644de83d5e3d19e292f870084dec',
        allowed:   false,
        mode:      'monitor',
        name:      'test-dep-55d796bc5c-smc89',
        operation: 'CREATE',
        kind:      'Pod',
        namespace: 'test',
        startTime: 1697570588430941,
        duration:  15184,
        mutated:   false
      }
    ]
  },
  {
    policyName: 'no-privilege-escalation',
    cluster:    'current_cluster',
    traces:     [
      {
        id:        'd300801925447ca66a605e242c78902e',
        allowed:   false,
        mode:      'monitor',
        name:      '',
        operation: 'CREATE',
        kind:      'Pod',
        namespace: 'test',
        startTime: 1697570588143999,
        duration:  6864,
        mutated:   false
      },
      {
        id:        '4db8793062062e47e817e8d9aa237c66',
        allowed:   false,
        mode:      'monitor',
        name:      'test-dep',
        operation: 'CREATE',
        kind:      'Deployment',
        namespace: 'test',
        startTime: 1697570587775344,
        duration:  6963,
        mutated:   false
      },
      {
        id:        'b1fbc12aa7ff8106fab366093c22bd94',
        allowed:   false,
        mode:      'monitor',
        name:      'test-dep-55d796bc5c',
        operation: 'CREATE',
        kind:      'ReplicaSet',
        namespace: 'test',
        startTime: 1697570587941979,
        duration:  10911,
        mutated:   false
      }
    ]
  },
  {
    policyName: 'no-privileged-pod',
    cluster:    'current_cluster',
    traces:     [
      {
        id:        '3c9375e05d413606bac9e21d17f1326b',
        allowed:   false,
        mode:      'monitor',
        name:      'test-dep',
        operation: 'CREATE',
        kind:      'Deployment',
        namespace: 'test',
        startTime: 1697570587860440,
        duration:  10521,
        mutated:   false
      },
      {
        id:        '7023e0be8a9feff26865bcefa585810b',
        allowed:   false,
        mode:      'monitor',
        name:      'test-dep-55d796bc5c',
        operation: 'CREATE',
        kind:      'ReplicaSet',
        namespace: 'test',
        startTime: 1697570587957665,
        duration:  11960,
        mutated:   false
      },
      {
        id:        '43b5056d0737723c2a79bbbf369580c1',
        allowed:   false,
        mode:      'monitor',
        name:      'test-dep-55d796bc5c-smc89',
        operation: 'CREATE',
        kind:      'Pod',
        namespace: 'test',
        startTime: 1697570588345654,
        duration:  8231,
        mutated:   false
      }
    ]
  }
];