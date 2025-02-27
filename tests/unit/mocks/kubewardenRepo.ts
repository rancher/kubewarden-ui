import { ClusterRepo } from '@kubewarden/types';

export default <ClusterRepo>{
  id:    'kubewarden-charts',
  type:  'catalog.cattle.io.clusterrepo',
  links: {
    chart:  'https://localhost:8005/v1/catalog.cattle.io.clusterrepos/kubewarden-charts?link=chart',
    icon:   'https://localhost:8005/v1/catalog.cattle.io.clusterrepos/kubewarden-charts?link=icon',
    index:  'https://localhost:8005/v1/catalog.cattle.io.clusterrepos/kubewarden-charts?link=index',
    info:   'https://localhost:8005/v1/catalog.cattle.io.clusterrepos/kubewarden-charts?link=info',
    remove: 'https://localhost:8005/v1/catalog.cattle.io.clusterrepos/kubewarden-charts',
    self:   'https://localhost:8005/v1/catalog.cattle.io.clusterrepos/kubewarden-charts',
    update: 'https://localhost:8005/v1/catalog.cattle.io.clusterrepos/kubewarden-charts',
    view:   'https://localhost:8005/apis/catalog.cattle.io/v1/clusterrepos/kubewarden-charts'
  },
  actions: {
    install: 'https://localhost:8005/v1/catalog.cattle.io.clusterrepos/kubewarden-charts?action=install',
    upgrade: 'https://localhost:8005/v1/catalog.cattle.io.clusterrepos/kubewarden-charts?action=upgrade'
  },
  apiVersion: 'catalog.cattle.io/v1',
  kind:       'ClusterRepo',
  metadata:   {
    creationTimestamp: '2025-02-20T20:45:22Z',
    fields:            [
      'kubewarden-charts',
      'https://charts.kubewarden.io',
      '2025-02-20T20:45:22Z'
    ],
    generation:    1,
    name:          'kubewarden-charts',
    relationships: [
      {
        toId:    'cattle-system/kubewarden-charts-0-bd2018fb-de5f-466d-bca3-c31e3432328a',
        toType:  'configmap',
        rel:     'owner',
        state:   'active',
        message: 'Resource is always ready'
      }
    ],
    resourceVersion: '94887',
    state:           {
      error:         false,
      message:       'Resource is current',
      name:          'active',
      transitioning: false
    },
    uid: 'bd2018fb-de5f-466d-bca3-c31e3432328a'
  },
  spec:   { url: 'https://charts.kubewarden.io' },
  status: {
    conditions: [
      {
        error:          false,
        lastUpdateTime: '2025-02-20T20:45:22Z',
        status:         'True',
        transitioning:  false,
        type:           'FollowerDownloaded'
      },
      {
        error:          false,
        lastUpdateTime: '2025-02-20T20:45:22Z',
        status:         'True',
        transitioning:  false,
        type:           'Downloaded'
      }
    ],
    downloadTime:            '2025-02-20T20:45:22Z',
    indexConfigMapName:      'kubewarden-charts-0-bd2018fb-de5f-466d-bca3-c31e3432328a',
    indexConfigMapNamespace: 'cattle-system',
    observedGeneration:      1,
    url:                     'https://charts.kubewarden.io'
  }
};
