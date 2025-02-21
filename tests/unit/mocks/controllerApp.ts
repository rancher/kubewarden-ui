import { FLEET } from '@shell/config/labels-annotations';
import { CatalogApp } from '@kubewarden/types';

export const mockControllerApp: CatalogApp = {
  id:         'cattle-kubewarden-system/rancher-kubewarden-controller',
  type:       'app',
  apiVersion: 'catalog.cattle.io/v1',
  kind:       'App',
  metadata:   {
    annotations:       {},
    labels:            {},
    name:              'rancher-kubewarden-controller',
    namespace:         'cattle-kubewarden-system'
  },
  spec: {
    chart: {
      metadata: {
        annotations: {
          'catalog.cattle.io/auto-install':        'kubewarden-crds=1.4.5',
          'catalog.cattle.io/certified':           'rancher',
          'catalog.cattle.io/display-name':        'Kubewarden',
          'catalog.cattle.io/namespace':           'cattle-kubewarden-system',
          'catalog.cattle.io/os':                  'linux',
          'catalog.cattle.io/provides-gvr':        'policyservers.policies.kubewarden.io/v1',
          'catalog.cattle.io/rancher-version':     '>= 2.6.0-0 <= 2.8.100-0',
          'catalog.cattle.io/release-name':        'rancher-kubewarden-controller',
          'catalog.cattle.io/requests-cpu':        '250m',
          'catalog.cattle.io/requests-memory':     '50Mi',
          'catalog.cattle.io/type':                'cluster-tool',
          'catalog.cattle.io/ui-component':        'kubewarden',
          'catalog.cattle.io/ui-source-repo':      'kubewarden-charts',
          'catalog.cattle.io/ui-source-repo-type': 'cluster',
          'catalog.cattle.io/upstream-version':    '2.0.9'
        },
        apiVersion:  'v2',
        appVersion:  'v1.11.0',
        name:       'kubewarden-controller',
        type:       'application',
        version:    '2.0.9'
      },
      values: {}
    },
    info:      { status: 'deployed' },
    name:      'rancher-kubewarden-controller',
    namespace: 'cattle-kubewarden-system',
    values:    {}
  },
  status: { summary: { state: 'deployed' } }
};

export const mockControllerAppWithFleet: CatalogApp = {
  ...mockControllerApp,
  spec: {
    ...mockControllerApp.spec,
    chart: {
      ...mockControllerApp.spec.chart,
      metadata: {
        ...mockControllerApp.spec.chart.metadata,
        annotations: {
          ...mockControllerApp.spec.chart.metadata.annotations,
          [FLEET.BUNDLE_ID]: 'fleet-default/kw-kubewarden-defaults'
        }
      }
    }
  }
};
