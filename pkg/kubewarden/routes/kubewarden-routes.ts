import { KUBEWARDEN_MENU, KUBEWARDEN_PRODUCT_NAME } from '@kubewarden/constants';

import Dashboard from '@kubewarden/pages/c/_cluster/kubewarden/index.vue';
import UnifiedPolicyList from '@kubewarden/pages/c/_cluster/kubewarden/_resource/unified-policy-list.vue';
import UnifiedPolicyDetail from '@kubewarden/pages/c/_cluster/kubewarden/_resource/unified-policy-detail.vue';

const routes = [
  {
    name:       `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }`,
    path:       `/c/:cluster/${ KUBEWARDEN_PRODUCT_NAME }`,
    component:  Dashboard,
    meta:       {
      product: KUBEWARDEN_PRODUCT_NAME,
      pkg:     KUBEWARDEN_PRODUCT_NAME
    }
  },
  {
    name:       `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }-${ KUBEWARDEN_MENU.POLICY }`,
    path:       `/c/:cluster/${ KUBEWARDEN_PRODUCT_NAME }/${ KUBEWARDEN_MENU.POLICY }`,
    component:  UnifiedPolicyList,
    meta:       {
      product: KUBEWARDEN_PRODUCT_NAME,
      pkg:     KUBEWARDEN_PRODUCT_NAME
    }
  },
  {
    name:       `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }-policy-id`,
    path:       `/c/:cluster/${ KUBEWARDEN_PRODUCT_NAME }/policy/:id`,
    component:  UnifiedPolicyDetail,
    meta:       {
      product: KUBEWARDEN_PRODUCT_NAME,
      pkg:     KUBEWARDEN_PRODUCT_NAME
    }
  }
];

export default routes;
