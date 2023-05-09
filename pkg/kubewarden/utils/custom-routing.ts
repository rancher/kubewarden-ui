import { KUBEWARDEN_PRODUCT_NAME } from '../types';

export const rootKubewardenRoute = () => ({
  name:    `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }`,
  params: { product: KUBEWARDEN_PRODUCT_NAME },
  meta:      {
    product: KUBEWARDEN_PRODUCT_NAME,
    pkg:     KUBEWARDEN_PRODUCT_NAME
  }
});

export const createKubewardenRoute = (name?: string, params?: Object, meta?: Object) => ({
  name:   name || `c-cluster-product-resource`,
  params: { ...rootKubewardenRoute().params, ...params },
  meta:   { ...rootKubewardenRoute().meta, ...meta }
});
