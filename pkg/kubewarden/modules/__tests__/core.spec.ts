import {
  splitGroupKind,
  schemasForGroup,
  namespacedGroups,
  namespacedSchemas,
  isResourceNamespaced
} from '@kubewarden/modules/core';

describe('splitGroupKind', () => {
  it('should return "apps.deployment" when given a Deployment resource with apiVersion "apps/v1"', () => {
    const resource = {
      kind:       'Deployment',
      apiVersion: 'apps/v1'
    };

    expect(splitGroupKind(resource)).toBe('apps.deployment');
  });

  it('should return undefined if kind is missing', () => {
    const resource = { apiVersion: 'apps/v1' };

    expect(splitGroupKind(resource)).toBeUndefined();
  });

  it('should return undefined if apiVersion is missing', () => {
    const resource = { kind: 'Deployment' };

    expect(splitGroupKind(resource)).toBeUndefined();
  });
});

describe('schemasForGroup', () => {
  const fakeSchemas = [
    {
      _group:     'apps',
      name:       'Deployment',
      attributes: {}
    },
    {
      _group:     'batch',
      name:       'Job',
      attributes: {}
    },
    {
      _group:     'apps',
      name:       'StatefulSet',
      attributes: {}
    }
  ];
  const mockStore = { getters: { 'cluster/all': jest.fn().mockReturnValue(fakeSchemas) } };

  it('should return an empty array if schemas are empty', () => {
    mockStore.getters['cluster/all'].mockReturnValueOnce([]);
    expect(schemasForGroup(mockStore, 'apps')).toEqual([]);
  });

  it('should return an empty array if group is empty', () => {
    expect(schemasForGroup(mockStore, '')).toEqual([]);
  });

  it('should filter schemas based on a group string', () => {
    const result = schemasForGroup(mockStore, 'apps');

    expect(result).toEqual([
      {
        _group:     'apps',
        name:       'Deployment',
        attributes: {}
      },
      {
        _group:     'apps',
        name:       'StatefulSet',
        attributes: {}
      }
    ]);
  });

  it('should filter schemas based on a group object with an id', () => {
    const result = schemasForGroup(mockStore, { id: 'batch' });

    expect(result).toEqual([{
      _group:     'batch',
      name:       'Job',
      attributes: {}
    }]);
  });
});

describe('namespacedGroups', () => {
  const fakeSchemas = [
    {
      _group:     'apps',
      name:       'Deployment',
      attributes: { namespaced: true }
    },
    {
      _group:     'batch',
      name:       'Job',
      attributes: { namespaced: false }
    },
    {
      _group:     'extensions',
      name:       'Ingress',
      attributes: {}
    } // namespaced undefined -> include
  ];
  const mockStore = { getters: { 'cluster/all': jest.fn().mockReturnValue(fakeSchemas) } };

  const apiGroups = [
    {
      id:          'apps',
      displayName: 'Apps'
    },
    {
      id:          'batch',
      displayName: 'Batch'
    },
    {
      id:          'core',
      displayName: 'Core'
    },
    {
      id:          'extensions',
      displayName: 'Extensions'
    }
  ];

  it('should return undefined if schemas are empty', () => {
    const emptyStore = { getters: { 'cluster/all': jest.fn().mockReturnValue([]) } };

    expect(namespacedGroups(emptyStore, apiGroups)).toBeUndefined();
  });

  it('should return undefined if apiGroups is empty', () => {
    expect(namespacedGroups(mockStore, [])).toBeUndefined();
  });

  it('should filter groups based on namespaced schemas, including "core"', () => {
    const result = namespacedGroups(mockStore, apiGroups);

    // "apps": namespaced true -> include
    // "batch": namespaced false -> exclude
    // "extensions": namespaced undefined -> include
    // "core": always included
    expect(result).toEqual([
      {
        id:          'apps',
        displayName: 'Apps'
      },
      {
        id:          'core',
        displayName: 'Core'
      },
      {
        id:          'extensions',
        displayName: 'Extensions'
      }
    ]);
  });
});

describe('namespacedSchemas', () => {
  it('should filter out schemas with namespaced explicitly false', () => {
    const schemas = [
      {
        name:       'Deployment',
        attributes: { namespaced: true }
      },
      {
        name:       'Job',
        attributes: { namespaced: false }
      },
      {
        name:       'Service',
        attributes: {}
      } // undefined -> include
    ];
    const result = namespacedSchemas(schemas);

    expect(result).toEqual([
      {
        name:       'Deployment',
        attributes: { namespaced: true }
      },
      {
        name:       'Service',
        attributes: {}
      }
    ]);
  });
});

describe('isResourceNamespaced', () => {
  it('should return true when resource.metadata has a namespace property', () => {
    const resource = {
      metadata: {
        namespace: 'default',
        name:      'my-resource'
      }
    };

    expect(isResourceNamespaced(resource)).toBe(true);
  });

  it('should return false when resource.metadata does not have a namespace property', () => {
    const resource = { metadata: { name: 'my-resource' } };

    expect(isResourceNamespaced(resource)).toBe(false);
  });
});
