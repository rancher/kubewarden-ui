import { removeEmptyAttrs } from '@kubewarden/utils/object';

describe('removeEmptyAttrs', () => {
  it('should remove attributes that are undefined, null, or empty', () => {
    const obj = {
      name:    'Test',
      value:   null,
      details: {},
      list:    [],
      nested:  {
        emptyString: '',
        emptyObj:    {},
        emptyArray:  [],
      },
    };
    const cleanedObj = removeEmptyAttrs(obj);

    expect(cleanedObj).toEqual({ name: 'Test' });
  });

  it('should remove deeply nested empty objects', () => {
    const obj = { level1: { level2: { level3: {} } } };
    const cleanedObj = removeEmptyAttrs(obj);

    expect(cleanedObj).toEqual(null);
  });

  it('should handle arrays and non-object values correctly', () => {
    const obj = {
      arrayNotEmpty: [1, 2, 3],
      stringValue:   'hello',
      numberValue:   123,
      booleanValue:  false,
      emptyObject:   {},
    };
    const cleanedObj = removeEmptyAttrs(obj);

    expect(cleanedObj).toEqual({
      arrayNotEmpty: [1, 2, 3],
      stringValue:   'hello',
      numberValue:   123,
      booleanValue:  false,
    });
  });

  it('should remove settings entirely if cpu and memory are empty', () => {
    const obj = {
      apiVersion: 'policies.kubewarden.io.v1',
      kind:       'ClusterAdmissionPolicy',
      spec:       {
        backgroundAudit: true,
        policyServer:    'default',
        settings:        {
          cpu:    {},
          memory: {},
        },
      },
    };
    const expectedObj = {
      apiVersion: 'policies.kubewarden.io.v1',
      kind:       'ClusterAdmissionPolicy',
      spec:       {
        backgroundAudit: true,
        policyServer:    'default'
      }
    };
    const cleanedObj = removeEmptyAttrs(obj);

    expect(cleanedObj).toEqual(expectedObj);
  });

  it('should remove the entire object if it becomes empty after cleanup', () => {
    const obj = {
      spec: {
        settings: {
          cpu:    {},
          memory: {},
        },
      },
    };
    const cleanedObj = removeEmptyAttrs(obj);

    expect(cleanedObj).toEqual(null);
  });

  it('should preserve empty-string entries inside arrays (e.g. apiGroups: [""] for core/v1)', () => {
    const obj = {
      spec: {
        rules: [
          {
            apiGroups:   [''],
            apiVersions: ['v1'],
            resources:   ['pods'],
            operations:  ['CREATE', 'UPDATE'],
          },
          {
            apiGroups:   ['apps'],
            apiVersions: ['v1'],
            resources:   ['deployments'],
            operations:  ['CREATE'],
          },
        ],
      },
    };
    const cleanedObj = removeEmptyAttrs(obj);

    expect(cleanedObj).toEqual(obj);
    expect(cleanedObj.spec.rules[0].apiGroups).toEqual(['']);
    // Ensure no sparse holes were introduced (which would JSON-serialize as null)
    expect(JSON.parse(JSON.stringify(cleanedObj))).toEqual(obj);
  });

  it('should remove only the empty memory object while preserving non-empty cpu object', () => {
    const obj = {
      settings: {
        cpu: {
          defaultLimit:   '100m',
          defaultRequest: '100m',
          maxLimit:       '100m',
        },
        memory: {},
      },
    };
    const expectedObj = {
      settings: {
        cpu: {
          defaultLimit:   '100m',
          defaultRequest: '100m',
          maxLimit:       '100m',
        },
      },
    };
    const cleanedObj = removeEmptyAttrs(obj);

    expect(cleanedObj).toEqual(expectedObj);
  });
});
