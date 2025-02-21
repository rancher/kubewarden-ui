import { CatalogApp } from '@kubewarden/types';

export const mockDefaultsApp: CatalogApp = {
  id:         'cattle-kubewarden-system/rancher-kubewarden-defaults',
  type:       'catalog.cattle.io.app',
  apiVersion: 'catalog.cattle.io/v1',
  kind:       'App',
  metadata:   {
    annotations: {},
    name:        'rancher-kubewarden-defaults',
    namespace:   'cattle-kubewarden-system',
    state:       {
      error:         false,
      message:       '',
      name:          'deployed',
      transitioning: false
    },
  },
  spec: {
    chart: {
      metadata: {
        annotations: {
          'catalog.cattle.io/auto-install':        'kubewarden-crds=1.4.3',
          'catalog.cattle.io/certified':           'rancher',
          'catalog.cattle.io/display-name':        'Kubewarden-defaults',
          'catalog.cattle.io/hidden':              'true',
          'catalog.cattle.io/namespace':           'cattle-kubewarden-system',
          'catalog.cattle.io/os':                  'linux',
          'catalog.cattle.io/release-name':        'rancher-kubewarden-defaults',
          'catalog.cattle.io/type':                'cluster-tool',
          'catalog.cattle.io/ui-component':        'kubewarden',
          'catalog.cattle.io/ui-source-repo':      'kubewarden-charts',
          'catalog.cattle.io/ui-source-repo-type': 'cluster',
          'catalog.cattle.io/upstream-version':    '1.8.1'
        },
        apiVersion:  'v2',
        appVersion:  'v1.8.0',
        name:       'kubewarden-defaults',
        type:       'application',
        version:    '1.8.1'
      },
      values: {}
    },
    name:        'rancher-kubewarden-defaults',
    namespace:   'cattle-kubewarden-system',
  },
  status: {
    observedGeneration: 2,
    summary:            { state: 'deployed' }
  }
};