import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { isAdminUser } from '@kubewarden/utils/permissions';

describe('isAdminUser', () => {
  let getters: any;

  beforeEach(() => {
    getters = { 'cluster/schemaFor': jest.fn(() => ({ resourceMethods: ['PUT'] })) };
  });

  it('should return true if all required schemas allow PUT', () => {
    expect(isAdminUser(getters)).toBe(true);
  });

  it('should return false if MANAGEMENT.SETTING does not allow PUT', () => {
    getters['cluster/schemaFor'].mockImplementation((resource: any) => {
      if (resource === MANAGEMENT.SETTING) {
        return { resourceMethods: [] };
      }

      return { resourceMethods: ['PUT'] };
    });

    expect(isAdminUser(getters)).toBe(false);
  });

  it('should return false if MANAGEMENT.FEATURE does not allow PUT', () => {
    getters['cluster/schemaFor'].mockImplementation((resource: any) => {
      if (resource === MANAGEMENT.FEATURE) {
        return { resourceMethods: [] };
      }

      return { resourceMethods: ['PUT'] };
    });

    expect(isAdminUser(getters)).toBe(false);
  });

  it('should return false if CATALOG.APP does not allow PUT', () => {
    getters['cluster/schemaFor'].mockImplementation((resource: any) => {
      if (resource === CATALOG.APP) {
        return { resourceMethods: [] };
      }

      return { resourceMethods: ['PUT'] };
    });

    expect(isAdminUser(getters)).toBe(false);
  });

  it('should return false if CATALOG.CLUSTER_REPO does not allow PUT', () => {
    getters['cluster/schemaFor'].mockImplementation((resource: any) => {
      if (resource === CATALOG.CLUSTER_REPO) {
        return { resourceMethods: [] };
      }

      return { resourceMethods: ['PUT'] };
    });

    expect(isAdminUser(getters)).toBe(false);
  });

  it('should return false if CATALOG.OPERATION does not allow PUT', () => {
    getters['cluster/schemaFor'].mockImplementation((resource: any) => {
      if (resource === CATALOG.OPERATION) {
        return { resourceMethods: [] };
      }

      return { resourceMethods: ['PUT'] };
    });

    expect(isAdminUser(getters)).toBe(false);
  });

  it('should return false if schemaFor returns undefined for a resource', () => {
    getters['cluster/schemaFor'].mockImplementation((resource: any) => {
      if (resource === MANAGEMENT.SETTING) {
        return undefined;
      }

      return { resourceMethods: ['PUT'] };
    });

    expect(isAdminUser(getters)).toBe(false);
  });
});
