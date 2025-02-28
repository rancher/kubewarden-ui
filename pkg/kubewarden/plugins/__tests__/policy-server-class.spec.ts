import { POD, WORKLOAD_TYPES } from '@shell/config/types';
import PolicyServerModel from '@kubewarden/plugins/policy-server-class';
import KubewardenModel from '@kubewarden/plugins/kubewarden-class';

describe('PolicyServerModel', () => {
  let instance: PolicyServerModel;
  let rootGetters: Record<string, any>;
  let dispatch: jest.Mock;

  beforeEach(() => {
    instance = new PolicyServerModel({});

    rootGetters = { 'cluster/canList': jest.fn().mockReturnValue(true) };
    dispatch = jest.fn();

    Object.defineProperty(instance, '$rootGetters', { value: rootGetters });
    Object.defineProperty(instance, '$dispatch', { value: dispatch });

    instance.metadata = { name: 'policy-server-1' };
  });

  describe('_availableActions', () => {
    let parentActionsSpy: jest.SpyInstance<any, []>;

    afterEach(() => {
      parentActionsSpy?.mockRestore();
    });

    it('should prepend openLogs action to parent available actions', () => {
      parentActionsSpy = jest
        .spyOn(KubewardenModel.prototype, '_availableActions', 'get')
        .mockReturnValue([{
          action: 'mockAction',
          label:  'Mock'
        }]);

      const actions = instance._availableActions;

      expect(actions[0]).toEqual({
        action:  'openLogs',
        enabled: true,
        icon:    'icon icon-fw icon-chevron-right',
        label:   'View Logs'
      });
      expect(actions).toContainEqual({
        action: 'mockAction',
        label:  'Mock'
      });
    });
  });

  describe('allRelatedPolicies', () => {
    it('returns related policies that match metadata name', async() => {
      const policy1 = { spec: { policyServer: 'policy-server-1' } };
      const policy2 = { spec: { policyServer: 'other' } };

      dispatch.mockImplementation((action) => {
        if (action === 'cluster/findAll') {
          return Promise.resolve([policy1, policy2]);
        }
      });

      const fn = instance.allRelatedPolicies;
      const result = await fn();

      // Expect two of the same policies to be returned because they are both considered different types (i.e. ClusterPolicy and Policy).
      expect(result).toEqual([policy1, policy1]);
    });

    it('handles errors and logs a warning', async() => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      dispatch.mockRejectedValue(new Error('Test error'));
      const fn = instance.allRelatedPolicies;

      await fn();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error fetching related policies:'));
      consoleSpy.mockRestore();
    });
  });

  describe('policyGauges', () => {
    it('returns an empty object if no related policies are found', async() => {
      // Stub allRelatedPolicies to return null.
      jest.spyOn(instance, 'allRelatedPolicies', 'get').mockReturnValue(() => Promise.resolve(null));
      const gauges = await instance.policyGauges();

      expect(gauges).toEqual({});
    });

    it('returns gauges with counts incremented based on related policies stateDisplay', async() => {
      // Create related policies with stateDisplay values.
      const relatedPolicies = [
        { stateDisplay: 'Active' },
        { stateDisplay: 'Pending' },
        { stateDisplay: 'Active' }
      ];

      // Stub allRelatedPolicies to return these policies.
      jest.spyOn(instance, 'allRelatedPolicies', 'get').mockReturnValue(() => Promise.resolve(relatedPolicies));

      // Stub colorForStatus to return a predictable value.
      const colorForStatusSpy = jest.spyOn(
        require('@kubewarden/plugins/kubewarden-class'),
        'colorForStatus'
      ).mockImplementation((...args: unknown[]) => {
        const status = args[0] as string;

        return `text-${ status.toLowerCase() }`;
      });


      const gauges = await instance.policyGauges();

      expect(gauges).toEqual({
        Active:  {
          color: 'active',
          count: 2
        },
        Pending: {
          color: 'pending',
          count: 1
        }
      });
      colorForStatusSpy.mockRestore();
    });
  });

  describe('tracesGauges', () => {
    it('returns an empty object if policyTraces is empty', () => {
      const fn = instance.tracesGauges;
      const result = fn([]);

      expect(result).toEqual({});
    });

    it('calculates gauges correctly for denied and mutated traces', () => {
      // Create sample policy traces.
      const policyTraces = [
        {
          traces: [
            {
              allowed: false,
              mode:    'protect',
              mutated: false
            },
            {
              allowed: false,
              mode:    'protect',
              mutated: false
            },
            {
              allowed: true,
              mode:    'protect',
              mutated: true
            },
            {
              allowed: true,
              mode:    'monitor',
              mutated: false
            } // Should be skipped.
          ]
        }
      ];

      // Stub colorForTraceStatus to return predictable colors.
      const colorForTraceStatusSpy = jest.spyOn(
        require('@kubewarden/plugins/kubewarden-class'),
        'colorForTraceStatus'
      ).mockImplementation((...args: unknown[]) => {
        const status = args[0] as string;

        return status === 'denied' ? 'red' : status === 'mutated' ? 'yellow' : '';
      });

      const fn = instance.tracesGauges;
      const result = fn(policyTraces);

      expect(result).toEqual({
        Denied:  {
          color: 'red',
          count: 2
        },
        Mutated: {
          color: 'yellow',
          count: 1
        }
      });
      colorForTraceStatusSpy.mockRestore();
    });
  });

  describe('matchingDeployment', () => {
    it('returns matching deployment using dispatch', async() => {
      const deployment = { id: 'deployment1' };

      dispatch.mockResolvedValue(deployment);
      const fn = instance.matchingDeployment;
      const result = await fn();

      expect(dispatch).toHaveBeenCalledWith(
        'cluster/findMatching',
        {
          type:     WORKLOAD_TYPES.DEPLOYMENT,
          selector: `kubewarden/policy-server=${ instance.metadata?.name }`
        },
        { root: true }
      );
      expect(result).toBe(deployment);
    });

    it('handles errors and logs a warning', async() => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      dispatch.mockRejectedValue(new Error('Deployment error'));
      const fn = instance.matchingDeployment;

      await fn();
      expect(consoleSpy).toHaveBeenCalledWith('Error matching policy-server to deployment', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('matchingPods', () => {
    it('returns matching pods using dispatch', async() => {
      const pods = [{ id: 'pod1' }];

      dispatch.mockResolvedValue(pods);
      const fn = instance.matchingPods;
      const result = await fn();

      expect(dispatch).toHaveBeenCalledWith(
        'cluster/findMatching',
        {
          type:     POD,
          selector: `app=kubewarden-policy-server-${ instance.metadata?.name }`
        },
        { root: true }
      );
      expect(result).toBe(pods);
    });

    it('handles errors and logs a warning', async() => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      dispatch.mockRejectedValue(new Error('Pods error'));
      const fn = instance.matchingPods;

      await fn();
      expect(consoleSpy).toHaveBeenCalledWith('Error matching policy-server to pod', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('openLogs', () => {
    it('dispatches wm/open if matching pods are found', async() => {
      const podArray = [{ id: 'pod1' }];

      // Stub matchingPods to return podArray.
      jest.spyOn(instance, 'matchingPods', 'get').mockReturnValue(() => Promise.resolve(podArray));

      // Set properties needed for openLogs.
      instance.id = 'server1';
      Object.defineProperty(instance, 'metadata', { value: { name: 'policy-server-1' } });

      await instance.openLogs();
      expect(dispatch).toHaveBeenCalledWith(
        'wm/open',
        {
          id:        'server1-logs',
          label:     'policy-server-1',
          icon:      'file',
          component: 'ContainerLogs',
          attrs:     { pod: podArray[0] }
        },
        { root: true }
      );
    });

    it('does not dispatch wm/open if matching pods are empty', async() => {
      // Stub matchingPods to return an empty array.
      jest.spyOn(instance, 'matchingPods', 'get').mockReturnValue(() => Promise.resolve([]));
      await instance.openLogs();
      expect(dispatch).not.toHaveBeenCalledWith(
        'wm/open',
        expect.any(Object),
        { root: true }
      );
    });

    it('handles errors and logs a warning in openLogs', async() => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Stub matchingPods to reject.
      jest.spyOn(instance, 'matchingPods', 'get').mockReturnValue(() => Promise.reject(new Error('Pod error')));
      await instance.openLogs();
      expect(consoleSpy).toHaveBeenCalledWith('Error dispatching console for pod', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
