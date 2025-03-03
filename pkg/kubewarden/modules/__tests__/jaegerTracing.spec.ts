import { jaegerTraces, jaegerPolicyName, convertTagsToObject } from '@kubewarden/modules/jaegerTracing';
import { KUBEWARDEN } from '@kubewarden/types';

jest.mock('@kubewarden/utils/service', () => ({ proxyUrl: jest.fn().mockReturnValue('http://mocked-proxy:16686/') }));

function createMockStore() {
  return {
    getters:   { currentCluster: { id: 'mock-cluster' } },
    dispatch:  jest.fn()
  };
}

describe('jaegerPolicyName', () => {
  it('returns clusterwide-<name> for a ClusterAdmissionPolicy', () => {
    const policy = {
      kind:     'ClusterAdmissionPolicy',
      metadata: { name: 'cap1' }
    };
    const result = jaegerPolicyName(policy);

    expect(result).toBe('clusterwide-cap1');
  });

  it('returns namespaced-<ns>-<name> for an AdmissionPolicy', () => {
    const policy = {
      kind:     'AdmissionPolicy',
      metadata: {
        name:      'ap1',
        namespace: 'ns1'
      }
    };
    const result = jaegerPolicyName(policy);

    expect(result).toBe('namespaced-ns1-ap1');
  });

  it('returns null if policy kind is unknown', () => {
    const policy = {
      kind:     'SomethingElse',
      metadata: { name: 'test' }
    };
    const result = jaegerPolicyName(policy);

    expect(result).toBeNull();
  });
});

describe('convertTagsToObject', () => {
  it('converts string, int64, float64, bool tags to correct JS types', () => {
    const input = [
      {
        key:   'myString',
        type:  'string',
        value: 'hello'
      },
      {
        key:   'myInt',
        type:  'int64',
        value: '42'
      },
      {
        key:   'myFloat',
        type:  'float64',
        value: '3.14'
      },
      {
        key:   'myBool',
        type:  'bool',
        value: 'true'
      },
      {
        key:   'unknown',
        type:  'xyz',
        value: 'whatever'
      }
    ];
    const result = convertTagsToObject(input);

    expect(result).toEqual({
      myString: 'hello',
      myInt:    42,
      myFloat:  3.14,
      myBool:   true,
      unknown:  'whatever'
    });
  });
});

describe('jaegerTraces', () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore();
  });

  it('fetches traces for each related policy in PolicyServer context', async() => {
    const config = {
      store,
      queryService:    {
        metadata: {
          name:      'jaeger-query',
          namespace: 'jaeger-ns'
        }
      },
      resource:        KUBEWARDEN.POLICY_SERVER,
      relatedPolicies: [
        {
          kind:     'ClusterAdmissionPolicy',
          metadata: { name: 'cap1' },
          spec:     { mode: 'monitor' }
        },
        {
          kind:     'AdmissionPolicy',
          metadata: {
            name:      'ap1',
            namespace: 'ns1'
          },
          spec: { mode: 'protect' }
        }
      ],
    };

    store.dispatch.mockResolvedValue({
      data: [
        {
          traceID: 'trace-111',
          spans:   [
            {
              operationName: 'validation',
              startTime:     123456789,
              duration:      50000,
              tags:          [
                {
                  key:   'policy_id',
                  value: 'clusterwide-cap1'
                },  // matches 1st policy
                {
                  key:   'allowed',
                  value: 'true',
                  type:  'bool'
                }
              ]
            }
          ]
        },
        {
          traceID: 'trace-222',
          spans:   [
            {
              operationName: 'validation',
              startTime:     123450000,
              duration:      40000,
              tags:          [
                {
                  key:   'policy_id',
                  value: 'namespaced-ns1-ap1'
                }, // matches 2nd policy
                {
                  key:   'allowed',
                  value: 'false',
                  type:  'bool'
                }
              ]
            }
          ]
        }
      ]
    });

    const result = await jaegerTraces(config);

    expect(store.dispatch).toHaveBeenCalledTimes(6);

    // Verify that it returns the scaffold with data for each policy
    // The final structure from `scaffoldPolicyTrace` is an array of { policyName, cluster, traces: [] }
    expect(result).toHaveLength(2);
    expect(result[0].policyName).toBe('cap1');
    expect(result[0].cluster).toBe('mock-cluster');
    expect(result[0].traces).toHaveLength(2);
    expect(result[0].traces[0]).toMatchObject({
      id:      'trace-111',
      allowed: true
    });

    expect(result[1].policyName).toBe('ap1');
    expect(result[1].traces).toHaveLength(2);

    // Also check that 'kubewarden/updatePolicyTraces' was dispatched for each trace
    // The code calls store.dispatch('kubewarden/updatePolicyTraces', { policyName, cluster, updatedTrace: ...})
    // inside scaffoldPolicyTrace
    // So we expect 2 additional dispatch calls for updating policyTraces:
    // - 1 for 'cap1'
    // - 1 for 'ap1'
    //
    // The total number of dispatch calls might be 4:
    //   2 for cluster/request + 2 for 'kubewarden/updatePolicyTraces'
    //
    const updateCalls = store.dispatch.mock.calls.filter(
      (c) => c[0] === 'kubewarden/updatePolicyTraces'
    );

    expect(updateCalls).toHaveLength(4);

    // Example: check one of them
    expect(updateCalls[0][1]).toMatchObject({
      policyName:   'cap1',
      updatedTrace: {
        allowed: true
        // ...
      }
    });
  });

  it('fetches traces for a single policy when "policy" is provided and returns the scaffold', async() => {
    const config = {
      store,
      queryService: {
        metadata: {
          name:      'jaeger-query',
          namespace: 'jaeger-ns'
        }
      },
      resource:     'kubewarden.admissionpolicy',
      policy:       {
        kind:     'AdmissionPolicy',
        metadata: {
          name:      'ap2',
          namespace: 'ns2'
        },
        spec: { mode: 'protect' }
      }
    };

    // Return a single trace
    store.dispatch.mockResolvedValue({
      data: [
        {
          traceID: 'trace-555',
          spans:   [
            {
              operationName: 'validation',
              startTime:     987654321,
              duration:      60000,
              tags:          [
                {
                  key:   'policy_id',
                  value: 'namespaced-ns2-ap2'
                },
                {
                  key:   'allowed',
                  value: 'true',
                  type:  'bool'
                }
              ]
            }
          ]
        }
      ]
    });

    const result = await jaegerTraces(config);

    expect(store.dispatch).toHaveBeenCalledTimes(2);

    expect(result).toHaveLength(1);
    expect(result[0].policyName).toBe('ap2');
    expect(result[0].traces).toHaveLength(1);
    expect(result[0].traces[0].id).toBe('trace-555');
  });

  it('throws an error if policy is undefined (and no relatedPolicies), returning null', async() => {
    // We'll check console.warn for the error message
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const config = {
      store,
      queryService: { metadata: { name: 'jaeger-query' } },
      resource:     'kubewarden.admissionpolicy'
      // no policy or relatedPolicies
    };

    const result = await jaegerTraces(config);

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error fetching Jaeger traces:')
    );

    consoleSpy.mockRestore();
  });

  it('handles errors in the request gracefully and returns null', async() => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const error = new Error('Request failed');

    store.dispatch.mockRejectedValueOnce(error);

    const config = {
      store,
      queryService: { metadata: { name: 'jaeger-query' } },
      resource:     'kubewarden.admissionpolicy',
      policy:       {
        kind:     'AdmissionPolicy',
        metadata: {
          name:      'ap2',
          namespace: 'ns2'
        },
        spec: { mode: 'protect' }
      }
    };

    const result = await jaegerTraces(config);

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching Jaeger traces: Error: Request failed'
    );
    consoleSpy.mockRestore();
  });
});
