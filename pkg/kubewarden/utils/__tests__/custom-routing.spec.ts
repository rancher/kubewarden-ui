import { KUBEWARDEN_PRODUCT_NAME } from '@kubewarden/types';

import { rootKubewardenRoute, createKubewardenRoute } from '@kubewarden/utils/custom-routing';

describe('Kubewarden Route Utilities', () => {
  describe('rootKubewardenRoute', () => {
    it('should return the default route config', () => {
      const route = rootKubewardenRoute();

      expect(route).toEqual({
        name:   `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }`,
        params: { product: KUBEWARDEN_PRODUCT_NAME },
        meta:   {
          pkg:     KUBEWARDEN_PRODUCT_NAME,
          product: KUBEWARDEN_PRODUCT_NAME
        }
      });
    });
  });

  describe('createKubewardenRoute', () => {
    it('should return default config when no config is provided', () => {
      const route = createKubewardenRoute();

      expect(route).toEqual({
        name:   `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }-resource`,
        params: { product: KUBEWARDEN_PRODUCT_NAME },
        meta:   {
          pkg:     KUBEWARDEN_PRODUCT_NAME,
          product: KUBEWARDEN_PRODUCT_NAME
        }
      });
    });

    it('should override the name if provided', () => {
      const customName = 'custom-route';
      const route = createKubewardenRoute({ name: customName });

      expect(route.name).toBe(customName);
    });

    it('should merge provided params with root params', () => {
      const extraParams = { extra: 'value' };
      const route = createKubewardenRoute({ params: extraParams });

      expect(route.params).toEqual({
        product: KUBEWARDEN_PRODUCT_NAME,
        extra:   'value'
      });
    });

    it('should merge provided meta with root meta', () => {
      const extraMeta = { extraMeta: 'value' };
      const route = createKubewardenRoute({ meta: extraMeta });

      expect(route.meta).toEqual({
        pkg:       KUBEWARDEN_PRODUCT_NAME,
        product:   KUBEWARDEN_PRODUCT_NAME,
        extraMeta: 'value'
      });
    });

    it('should override root meta values with provided meta', () => {
      const overrideMeta = { pkg: 'override' };
      const route = createKubewardenRoute({ meta: overrideMeta });

      expect(route.meta).toEqual({
        pkg:     'override',
        product: KUBEWARDEN_PRODUCT_NAME
      });
    });

    it('should override the default name when provided', () => {
      const route = createKubewardenRoute({ name: 'custom-name' });

      expect(route.name).toBe('custom-name');
    });
  });
});
