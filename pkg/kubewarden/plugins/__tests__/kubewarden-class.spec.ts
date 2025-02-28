import KubewardenModel, {
  colorForStatus,
  colorForPolicyServerState,
  stateSort,
  colorForTraceStatus,
  getLatestVersion
} from '@kubewarden/plugins/kubewarden-class';

jest.mock('@kubewarden/formatters/PolicyStatus.vue', () => ({ default: 'mockComponent' }));

describe('KubewardenModel', () => {
  let instance: KubewardenModel;
  let rootGetters: Record<string, jest.Mock>;
  let dispatch: jest.Mock;

  beforeEach(() => {
    rootGetters = {
      'cluster/all':    jest.fn(),
      'management/all': jest.fn()
    };

    dispatch = jest.fn();

    instance = new KubewardenModel({});

    // Override read-only properties on the instance:
    Object.defineProperty(instance, '$rootGetters', { value: rootGetters });
    Object.defineProperty(instance, '$dispatch', { value: dispatch });

    instance.status = {};
    instance.metadata = {};
    instance.spec = {};
  });

  describe('allServices', () => {
    it('returns services from rootGetters if available', async() => {
      const services = [{ id: 1 }];

      rootGetters['cluster/all'].mockReturnValue(services);

      const result = await instance.allServices();

      expect(result).toBe(services);
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('dispatches cluster/findAll if no services are found', async() => {
      rootGetters['cluster/all'].mockReturnValue([]);
      dispatch.mockResolvedValue(['fetched service']);

      const result = await instance.allServices();

      expect(dispatch).toHaveBeenCalledWith(
        'cluster/findAll',
        { type: expect.any(String) },
        { root: true }
      );
      expect(result).toEqual(['fetched service']);
    });
  });

  describe('detailPageHeaderBadgeOverride', () => {
    it('returns status.policyStatus', () => {
      instance.status = { policyStatus: 'active' };
      expect(instance.detailPageHeaderBadgeOverride).toBe('active');
    });
  });

  describe('componentForBadge', () => {
    it('returns the component when detailPageHeaderBadgeOverride exists', () => {
      instance.status = { policyStatus: 'active' };
      expect(instance.componentForBadge).toBe('mockComponent');
    });

    it('returns null when detailPageHeaderBadgeOverride is falsy', () => {
      instance.status = {};
      expect(instance.componentForBadge).toBeNull();
    });
  });

  describe('namespaceSelector', () => {
    it('returns true if metadata.namespace is in RANCHER_NAMESPACES', () => {
      // Assuming "cattle-system" is in the Rancher namespaces list.
      instance.metadata = { namespace: 'cattle-system' };
      instance.spec = { namespaceSelector: { matchExpressions: [] } };
      expect(instance.namespaceSelector).toBe(true);
    });

    it('returns false when no matching selector is found', () => {
      instance.metadata = { namespace: 'other' };
      instance.spec = { namespaceSelector: { matchExpressions: [] } };
      expect(instance.namespaceSelector).toBe(false);
    });
  });

  describe('haveComponent', () => {
    it('returns true if the component exists', () => {
      expect(instance.haveComponent('kubewarden/admission')).toBe(true);
    });

    it('returns false if the component does not exist', () => {
      expect(instance.haveComponent('nonexistent')).toBe(false);
    });
  });

  describe('importComponent', () => {
    it('throws an error if no name is provided', () => {
      expect(() => instance.importComponent('')).toThrow('Name required');
    });

    it('returns a function when a valid name is provided', () => {
      const importer = instance.importComponent('testComponent');

      expect(typeof importer).toBe('function');
    });
  });

  describe('toggleUpdateMode', () => {
    it('dispatches cluster/promptModal with proper parameters', () => {
      instance.toggleUpdateMode();
      expect(dispatch).toHaveBeenCalledWith(
        'cluster/promptModal',
        expect.objectContaining({ component: 'UpdateModeDialog' }),
        { root: true }
      );
    });
  });

  describe('Exported functions', () => {
    describe('colorForStatus', () => {
      it('returns correct colors for known statuses', () => {
        expect(colorForStatus('unschedulable')).toBe('text-error');
        expect(colorForStatus('pending')).toBe('text-info');
        expect(colorForStatus('active')).toBe('text-success');
      });
      it('returns default color for unknown status', () => {
        expect(colorForStatus('unknown')).toBe('text-warning');
      });
    });

    describe('colorForPolicyServerState', () => {
      it('returns "info" if state does not match any known state', () => {
        expect(colorForPolicyServerState('non-existent')).toBe('info');
      });
    });

    describe('stateSort', () => {
      it('returns the correct sort string based on the color', () => {
        expect(stateSort('text-error', 'Item')).toMatch(/^1 Item/);
        expect(stateSort('bg-warning', 'Item')).toMatch(/^2 Item/);
        expect(stateSort('text-success', 'Item')).toMatch(/^4 Item/);
        // For an unknown color the default should be used:
        expect(stateSort('text-unknown', 'Item')).toMatch(/^8 Item/);
      });
    });

    describe('colorForTraceStatus', () => {
      it('returns correct color for allowed', () => {
        expect(colorForTraceStatus('allowed')).toBe('success');
      });
      it('returns correct color for denied', () => {
        expect(colorForTraceStatus('denied')).toBe('error');
      });
      it('returns correct color for mutated', () => {
        expect(colorForTraceStatus('mutated')).toBe('warning');
      });
      it('returns default color for an unknown status', () => {
        expect(colorForTraceStatus('unknown')).toBe('success');
      });
    });

    describe('getLatestVersion', () => {
      it('returns the latest version excluding prereleases when showPreRelease is false', () => {
        const versions = [
          { version: '1.0.0' },
          { version: '1.0.1-beta' },
          { version: '1.0.2' }
        ];
        const storeWithoutPreRelease = { getters: { 'prefs/get': () => false } };

        expect(getLatestVersion(storeWithoutPreRelease as any, versions)).toBe('1.0.2');
      });

      it('returns the latest version including prereleases when showPreRelease is true', () => {
        const versions = [
          { version: '1.0.0' },
          { version: '1.0.1-beta' },
          { version: '1.0.2' }
        ];
        const storeWithPreRelease = { getters: { 'prefs/get': () => true } };

        expect(getLatestVersion(storeWithPreRelease as any, versions)).toBe('1.0.2');
      });
    });
  });
});
