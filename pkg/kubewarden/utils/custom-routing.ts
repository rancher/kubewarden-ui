import { KUBEWARDEN_PRODUCT_NAME } from '../types';

export const rootKubewardenRoute = () => ({
  name:    `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }`,
  params: { product: KUBEWARDEN_PRODUCT_NAME }
});
