import { KUBEWARDEN_PRODUCT_NAME } from '../types';

import Dashboard from '../pages/c/_cluster/kubewarden/index.vue';
import KubewardenResourcedList from '../pages/c/_cluster/kubewarden/_resource/index.vue';
import CreateKubewardenResource from '../pages/c/_cluster/kubewarden/_resource/create.vue';
import ViewKubewardenResource from '../pages/c/_cluster/kubewarden/_resource/_id.vue';
import ViewKubewardenNsResource from '../pages/c/_cluster/kubewarden/_resource/_namespace/_id.vue';

const routes = [
  {
    name:       `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster`,
    path:       `/${ KUBEWARDEN_PRODUCT_NAME }/c/:cluster`,
    component:  Dashboard,
    params:     { product: KUBEWARDEN_PRODUCT_NAME, pkg: KUBEWARDEN_PRODUCT_NAME },
    meta:       { product: KUBEWARDEN_PRODUCT_NAME, pkg: KUBEWARDEN_PRODUCT_NAME }
  },
  {
    name:       `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster-resource`,
    path:       `/${ KUBEWARDEN_PRODUCT_NAME }/c/:cluster/:resource`,
    component:  KubewardenResourcedList,
    params:     { product: KUBEWARDEN_PRODUCT_NAME, pkg: KUBEWARDEN_PRODUCT_NAME },
    meta:       { product: KUBEWARDEN_PRODUCT_NAME, pkg: KUBEWARDEN_PRODUCT_NAME }
  },
  {
    name:       `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster-resource-create`,
    path:       `/${ KUBEWARDEN_PRODUCT_NAME }/c/:cluster/:resource/create`,
    component:  CreateKubewardenResource,
    params:     { product: KUBEWARDEN_PRODUCT_NAME, pkg: KUBEWARDEN_PRODUCT_NAME },
    meta:       { product: KUBEWARDEN_PRODUCT_NAME, pkg: KUBEWARDEN_PRODUCT_NAME }
  },
  {
    name:       `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster-resource-id`,
    path:       `/${ KUBEWARDEN_PRODUCT_NAME }/c/:cluster/:resource/:id`,
    component:  ViewKubewardenResource,
    params:     { product: KUBEWARDEN_PRODUCT_NAME, pkg: KUBEWARDEN_PRODUCT_NAME },
    meta:       { product: KUBEWARDEN_PRODUCT_NAME, pkg: KUBEWARDEN_PRODUCT_NAME }
  },
  {
    name:       `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster-resource-namespace-id`,
    path:       `/${ KUBEWARDEN_PRODUCT_NAME }/c/:cluster/:resource/:namespace/:id`,
    component:  ViewKubewardenNsResource,
    params:     { product: KUBEWARDEN_PRODUCT_NAME, pkg: KUBEWARDEN_PRODUCT_NAME },
    meta:       { product: KUBEWARDEN_PRODUCT_NAME, pkg: KUBEWARDEN_PRODUCT_NAME }
  }
];

export default routes;
