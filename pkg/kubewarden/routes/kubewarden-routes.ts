import { KUBEWARDEN_PRODUCT_NAME } from '../types';

import Dashboard from '../pages/c/_cluster/kubewarden/index.vue';
import KubewardenResourcedList from '../pages/c/_cluster/kubewarden/_resource/index.vue';
import CreateKubewardenResource from '../pages/c/_cluster/kubewarden/_resource/create.vue';
import ViewKubewardenResource from '../pages/c/_cluster/kubewarden/_resource/_id.vue';
import ViewKubewardenNsResource from '../pages/c/_cluster/kubewarden/_resource/_namespace/_id.vue';

const routes = [
  {
    name:       `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }`,
    path:       `/c/:cluster/:product/dashboard`,
    component:  Dashboard,
  },
  {
    name:       `c-cluster-product-resource`,
    path:       `/c/:cluster/:product/:resource`,
    component:  KubewardenResourcedList
  },
  {
    name:       `c-cluster-product-resource-create`,
    path:       `/c/:cluster/:product/:resource/create`,
    component:  CreateKubewardenResource,
  },
  {
    name:       `c-cluster-product-resource-id`,
    path:       `/c/:cluster/:product/:resource/:id`,
    component:  ViewKubewardenResource,
  },
  {
    name:       `c-cluster-product-resource-namespace-id`,
    path:       `/c/:cluster/:product/:resource/:namespace/:id`,
    component:  ViewKubewardenNsResource,
  }
];

export default routes;
