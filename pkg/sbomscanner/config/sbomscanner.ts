import {
  PRODUCT_NAME,
  PAGE,
  RESOURCE
} from '@sbomscanner/types';

export function init($plugin: any, store: any) {
  const {
    product, virtualType, basicType, weightType
  } = $plugin.DSL(store, PRODUCT_NAME);

  product({
    icon:    'pod_security',
    inStore: 'cluster',
  });

  virtualType({
    labelKey:   'imageScanner.dashboard.title',
    name:       PAGE.DASHBOARD,
    namespaced: false,
    route:      {
      name:   `c-cluster-${PRODUCT_NAME}-${PAGE.DASHBOARD}`,
      params: { product: PRODUCT_NAME },
      meta:   { pkg: PRODUCT_NAME, product: PRODUCT_NAME }
    },
    overview: true
  });

  virtualType({
    labelKey:   'imageScanner.registries.title',
    name:       PAGE.REGISTRIES,
    namespaced: false,
    route:      {
      name:   `c-cluster-${PRODUCT_NAME}-${PAGE.REGISTRIES}`,
      params: {
        product:  PRODUCT_NAME,
        resource: RESOURCE.REGISTRY,
      },
      meta: { pkg: PRODUCT_NAME, product: PRODUCT_NAME }
    },
  });

  virtualType({
    labelKey:   'imageScanner.images.title',
    name:       PAGE.IMAGES,
    namespaced: false,
    route:      {
      name:   `c-cluster-${PRODUCT_NAME}-${PAGE.IMAGES}`,
      params: { product: PRODUCT_NAME },
      meta:   { pkg: PRODUCT_NAME, product: PRODUCT_NAME }
    }
  });

  // virtualType({
  //   labelKey: "imageScanner.vulnerabilities.title",
  //   name: PAGE.VULNERABILITIES,
  //   namespaced: false,
  //   route: {
  //     name: `c-cluster-${PRODUCT_NAME}-${PAGE.VULNERABILITIES}`,
  //     params: {
  //       product: PRODUCT_NAME,
  //     },
  //     meta: { pkg: PRODUCT_NAME, product: PRODUCT_NAME },
  //   },
  // });

  virtualType({
    labelKey:   'imageScanner.vexManagement.title',
    name:       PAGE.VEX_MANAGEMENT,
    namespaced: false,
    route:      {
      name:   `c-cluster-${PRODUCT_NAME}-${PAGE.VEX_MANAGEMENT}`,
      params: { product: PRODUCT_NAME },
      meta:   { pkg: PRODUCT_NAME, product: PRODUCT_NAME },
    },
  });

  weightType(PAGE.DASHBOARD, 98, true);
  weightType(PAGE.IMAGES, 97, true);
  // weightType(PAGE.VULNERABILITIES, 96, true);
  weightType(PAGE.VEX_MANAGEMENT, 95, true);

  basicType([
    PAGE.DASHBOARD,
    PAGE.IMAGES,
    // PAGE.VULNERABILITIES,
  ]);
  // Prepend spaces on group name, as Rancher 2.12 render group name align with sidemenu
  basicType([PAGE.REGISTRIES, PAGE.VEX_MANAGEMENT], '&nbsp;&nbsp;&nbsp;&nbsp;Advanced');

}