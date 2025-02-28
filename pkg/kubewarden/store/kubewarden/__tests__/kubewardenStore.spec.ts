import storeModule, { StateConfig } from '@kubewarden/store/kubewarden/index';

describe('Kubewarden Vuex Store Module', () => {
  let state: StateConfig;

  beforeEach(() => {
    state = storeModule.specifics.state();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      expect(state.airGapped).toBe(false);
      expect(state.fleetRepos).toEqual([]);
      expect(state.hideBannerDefaults).toBe(false);
      expect(state.hideBannerArtifactHub).toBe(false);
      expect(state.hideBannerAirgapPolicy).toBe(false);
      expect(state.controllerApp).toBeNull();
      expect(state.kubewardenCrds).toEqual([]);
      expect(state.loadingReports).toBe(false);
      expect(state.policyReports).toEqual([]);
      expect(state.clusterPolicyReports).toEqual([]);
      expect(state.reportMap).toEqual({});
      expect(state.summaryMap).toEqual({});
      expect(state.policyTraces).toEqual([]);
      expect(state.refreshingCharts).toBe(false);
    });
  });

  describe('Getters', () => {
    const { getters } = storeModule.specifics;

    it('should return the airGapped state', () => {
      expect(getters.airGapped(state)).toBe(false);
    });

    it('should return hideBannerDefaults state', () => {
      expect(getters.hideBannerDefaults(state)).toBe(false);
    });

    it('should return hideBannerArtifactHub state', () => {
      expect(getters.hideBannerArtifactHub(state)).toBe(false);
    });

    it('should return hideBannerAirgapPolicy state', () => {
      expect(getters.hideBannerAirgapPolicy(state)).toBe(false);
    });

    it('should return controllerApp state', () => {
      expect(getters.controllerApp(state)).toBeNull();
    });

    it('should return kubewardenCrds state', () => {
      expect(getters.kubewardenCrds(state)).toEqual([]);
    });

    it('should return loadingReports state', () => {
      expect(getters.loadingReports(state)).toBe(false);
    });

    it('should return policyReports state', () => {
      expect(getters.policyReports(state)).toEqual([]);
    });

    it('should return clusterPolicyReports state', () => {
      expect(getters.clusterPolicyReports(state)).toEqual([]);
    });

    it('should return policyTraces state', () => {
      expect(getters.policyTraces(state)).toEqual([]);
    });

    it('should return refreshingCharts state', () => {
      expect(getters.refreshingCharts(state)).toBe(false);
    });

    describe('reportByResourceId', () => {
      it('should return the report for a given resource id from reportMap', () => {
        const resourceId = 'test-resource';

        state.reportMap = { [resourceId]: { report: 'some-report-data' } };

        const report = getters.reportByResourceId(state)(resourceId);

        expect(report).toEqual({ report: 'some-report-data' });
      });

      it('should return undefined for a non-existent resource id', () => {
        const report = getters.reportByResourceId(state)('non-existent');

        expect(report).toBeUndefined();
      });
    });

    describe('summaryByResourceId', () => {
      it('should return the default summary when a resource id is not found', () => {
        const summary = getters.summaryByResourceId(state)('unknown-resource');

        expect(summary).toEqual({
          pass:  0,
          fail:  0,
          warn:  0,
          error: 0,
          skip:  0
        });
      });

      it('should return the summary from summaryMap if available', () => {
        const resourceId = 'existing-resource';

        state.summaryMap = {
          [resourceId]: {
            pass:  3,
            fail:  1,
            warn:  2,
            error: 0,
            skip:  1
          }
        };

        const summary = getters.summaryByResourceId(state)(resourceId);

        expect(summary).toEqual({
          pass:  3,
          fail:  1,
          warn:  2,
          error: 0,
          skip:  1
        });
      });
    });
  });
});
