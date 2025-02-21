import { FleetBundle } from '@kubewarden/types';

export const fleetBundles: FleetBundle[] = [
  {
    id:         'fleet-default/kw-kubewarden-defaults',
    type:       'fleet.cattle.io.bundle',
    apiVersion: 'fleet.cattle.io/v1alpha1',
    kind:       'Bundle',
    metadata:   {
      finalizers: [
        'fleet.cattle.io/bundle-finalizer'
      ],
      labels:     {
        app:                         'kubewarden-defaults',
        'fleet.cattle.io/commit':    'd3d98d1d971db0bc9afa6aff54c93ef4a3c45bc2',
        'fleet.cattle.io/repo-name': 'kw'
      },
      name:            'kw-kubewarden-defaults',
      namespace:       'fleet-default',
    },
    spec: {
      defaultNamespace: 'kubewarden',
      dependsOn:        [
        { selector: { matchLabels: { app: 'kubewarden-controller' } } }
      ],
      helm: {
        chart:       'kubewarden-defaults',
        releaseName: 'kubewarden-defaults',
        repo:        'https://charts.kubewarden.io/',
        values:      {
          recommendedPolicies: {
            defaultPolicyMode: 'monitor',
            enabled:           true
          }
        },
        version: '2.2.1'
      },
      resources: [
        {
          content: '#Test resource content',
          name:    '.chart/test/test.yaml'
        },
        {
          content: `
          kind: PolicyServer
          global:
            cattle:
              systemDefaultRegistry: ghcr.io
          policyServer:
            image:
              repository: "kubewarden/policy-server"
              tag: v1.15.0
          `,
          name: '.chart/d496c839b4e1a2e4e1c3fcdae93ea9e344aa24e971b45300019c866216c01420/kubewarden-defaults/values.yaml'
        }
      ],
      targetRestrictions: [
        { clusterName: 'k3s-1' }
      ],
      targets: [
        {
          clusterName: 'k3s-1',
          ignore:      {}
        }
      ]
    }
  }
];