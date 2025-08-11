import { KUBEWARDEN_MENU, KUBEWARDEN_PRODUCT_NAME } from '@kubewarden/constants';
import { POLICY_REPORTER_PRODUCT } from '@kubewarden/types';

import Dashboard from '@kubewarden/pages/c/_cluster/kubewarden/index.vue';
import PolicyGroup from '@kubewarden/pages/c/_cluster/kubewarden/_resource/policy-group.vue';
import PolicyReport from '@kubewarden/pages/c/_cluster/kubewarden/_resource/policy-reporter.vue';
import KubewardenResourcedList from '@kubewarden/pages/c/_cluster/kubewarden/_resource/index.vue';
import CreateKubewardenResource from '@kubewarden/pages/c/_cluster/kubewarden/_resource/create.vue';
import ViewKubewardenResource from '@kubewarden/pages/c/_cluster/kubewarden/_resource/_id.vue';
import ViewKubewardenNsResource from '@kubewarden/pages/c/_cluster/kubewarden/_resource/_namespace/_id.vue';

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
    component:  PolicyGroup,
    meta:       {
      product: KUBEWARDEN_PRODUCT_NAME,
      pkg:     KUBEWARDEN_PRODUCT_NAME
    }
  },
  {
    name:       `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }-${ POLICY_REPORTER_PRODUCT }`,
    path:       `/c/:cluster/${ KUBEWARDEN_PRODUCT_NAME }/${ POLICY_REPORTER_PRODUCT }`,
    component:  PolicyReport,
    meta:       {
      product: KUBEWARDEN_PRODUCT_NAME,
      pkg:     KUBEWARDEN_PRODUCT_NAME
    }
  },
  {
    name:       `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }-resource`,
    path:       `/c/:cluster/${ KUBEWARDEN_PRODUCT_NAME }/:resource`,
    component:  KubewardenResourcedList,
    meta:       {
      product: KUBEWARDEN_PRODUCT_NAME,
      pkg:     KUBEWARDEN_PRODUCT_NAME
    }
  },
  {
    name:       `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }-resource-create`,
    path:       `/c/:cluster/${ KUBEWARDEN_PRODUCT_NAME }/:resource/create`,
    component:  CreateKubewardenResource,
    meta:       {
      product: KUBEWARDEN_PRODUCT_NAME,
      pkg:     KUBEWARDEN_PRODUCT_NAME
    }
  },
  {
    name:       `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }-resource-id`,
    path:       `/c/:cluster/${ KUBEWARDEN_PRODUCT_NAME }/:resource/:id`,
    component:  ViewKubewardenResource,
    meta:       {
      product: KUBEWARDEN_PRODUCT_NAME,
      pkg:     KUBEWARDEN_PRODUCT_NAME
    }
  },
  {
    name:       `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }-resource-namespace-id`,
    path:       `/c/:cluster/${ KUBEWARDEN_PRODUCT_NAME }/:resource/:namespace/:id`,
    component:  ViewKubewardenNsResource,
    meta:       {
      product: KUBEWARDEN_PRODUCT_NAME,
      pkg:     KUBEWARDEN_PRODUCT_NAME
    }
  }
];

export default routes;
