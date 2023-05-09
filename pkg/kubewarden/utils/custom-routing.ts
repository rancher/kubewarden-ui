import { KUBEWARDEN_PRODUCT_NAME } from '../types';

interface KubewardenRouteConfig {
  name?: string;
  params?: {
    [key: string]: any;
  };
  meta?: {
    [key: string]: any;
  };
}

export const rootKubewardenRoute = (): KubewardenRouteConfig => ({
  name:   `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }`,
  params: { product: KUBEWARDEN_PRODUCT_NAME },
  meta:   { pkg: KUBEWARDEN_PRODUCT_NAME, product: KUBEWARDEN_PRODUCT_NAME }
});

export const createKubewardenRoute = (config?: KubewardenRouteConfig) => {
  const { name, params = {}, meta = {} } = config || {};

  return {
    name:   name || `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }-resource`,
    params: { ...rootKubewardenRoute().params, ...params },
    meta:   { ...rootKubewardenRoute().meta, ...meta }
  };
};
