import RegistryDetails from '@sbomscanner/components/RegistryDetails.vue';
import ImageOverview from '@sbomscanner/pages/c/_cluster/sbomscanner/ImageOverview.vue';
import ImageDetails from '@sbomscanner/components/ImageDetails.vue';
import RegistriesConfiguration from '@sbomscanner/pages/c/_cluster/sbomscanner/RegistriesConfiguration.vue';
// import Vulnerabilities from "@sbomscanner/pages/c/_cluster/sbomscanner/Vulnerabilities.vue";
import CreateResource from '@sbomscanner/pages/c/_cluster/sbomscanner/_resource/create.vue';
import ListResource from '@sbomscanner/pages/c/_cluster/sbomscanner/_resource/index.vue';
import Entry from '@sbomscanner/pages/c/_cluster/sbomscanner/index.vue';
import VexManagement from '@sbomscanner/pages/c/_cluster/sbomscanner/VexManagement.vue';
import CveDetails from '@sbomscanner/components/CveDetails.vue';
import VexDetails from '@sbomscanner/components/VexDetails.vue';
import {
  PRODUCT_NAME,
  PAGE,
  RESOURCE,
} from '@sbomscanner/types';

const routes = [
  {
    name:      `c-cluster-${ PRODUCT_NAME }-${PAGE.DASHBOARD}`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/${PAGE.DASHBOARD}`,
    component: Entry,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.IMAGES}`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.IMAGES}`,
    component: ImageOverview,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.IMAGES}-id`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.IMAGES}/:id`,
    component: ImageDetails,
  },
  // {
  //   name: `c-cluster-${PRODUCT_NAME}-${PAGE.VULNERABILITIES}`,
  //   path: `/c/:cluster/${PRODUCT_NAME}/${PAGE.VULNERABILITIES}`,
  //   component: Vulnerabilities,
  // },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.REGISTRIES}`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.REGISTRIES}`,
    component: RegistriesConfiguration,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.REGISTRIES}-id`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.REGISTRIES}/:ns/:id`,
    component: RegistryDetails,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.VEX_MANAGEMENT}`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.VEX_MANAGEMENT}`,
    component: VexManagement,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.VEX_MANAGEMENT}-id`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.VEX_MANAGEMENT}/:id`,
    component: VexDetails,
  },
  {
    name:      `c-cluster-${PRODUCT_NAME}-${PAGE.VULNERABILITIES}-id`,
    path:      `/c/:cluster/${PRODUCT_NAME}/${PAGE.VULNERABILITIES}/:id`,
    component: CveDetails,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-create`,
    path:      `/${ PRODUCT_NAME }/c/:cluster/:resource/create`,
    component: CreateResource,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:        `${ PRODUCT_NAME }-c-cluster-resource`,
    path:        `/${ PRODUCT_NAME }/c/:cluster/:resource`,
    component:   ListResource,
    meta:        { product: PRODUCT_NAME },
    beforeEnter: (to: any, from: any, next: any) => {
      // Redirect VexHub resource to custom VexManagement page
      if (to.params.resource === RESOURCE.VEX_HUB) {
        next({
          name:   `c-cluster-${PRODUCT_NAME}-${PAGE.VEX_MANAGEMENT}`,
          params: {
            cluster: to.params.cluster,
            product: PRODUCT_NAME
          }
        });
      } else {
        next();
      }
    }
  },
];

export default routes;
