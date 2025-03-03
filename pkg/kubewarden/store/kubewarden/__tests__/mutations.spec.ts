import mutations from '@kubewarden/store/kubewarden/mutations';
import { StateConfig } from '@kubewarden/store/kubewarden/index';

describe('Vuex Mutations', () => {
  let state: StateConfig;

  beforeEach(() => {
    state = {
      airGapped:              false,
      fleetRepos:             [],
      hideBannerDefaults:     false,
      hideBannerArtifactHub:  false,
      hideBannerAirgapPolicy: false,
      controllerApp:          null,
      kubewardenCrds:         [],
      loadingReports:         false,
      policyReports:          [],
      clusterPolicyReports:   [],
      reportMap:              {},
      summaryMap:             {},
      policyTraces:           [],
      refreshingCharts:       false
    };
  });

  it('updateAirGapped sets airGapped state', () => {
    mutations.updateAirGapped(state, true);
    expect(state.airGapped).toBe(true);
  });

  it('updateHideBannerDefaults sets hideBannerDefaults state', () => {
    mutations.updateHideBannerDefaults(state, true);
    expect(state.hideBannerDefaults).toBe(true);
  });

  it('updateHideBannerArtifactHub sets hideBannerArtifactHub state', () => {
    mutations.updateHideBannerArtifactHub(state, true);
    expect(state.hideBannerArtifactHub).toBe(true);
  });

  it('updateHideBannerAirgapPolicy sets hideBannerAirgapPolicy state', () => {
    mutations.updateHideBannerAirgapPolicy(state, true);
    expect(state.hideBannerAirgapPolicy).toBe(true);
  });

  it('updateControllerApp adds new controllerApp if none exists', () => {
    const app = {
      id:       'app1',
      metadata: { version: '1.0' },
      spec:     { config: 'a' },
      status:   { running: true }
    };

    mutations.updateControllerApp(state, app);
    expect(state.controllerApp).toEqual(app);
  });

  it('updateControllerApp updates controllerApp if id matches', () => {
    const existingApp = {
      id:       'app1',
      metadata: { version: '1.0' },
      spec:     { config: 'a' },
      status:   { running: false }
    };

    state.controllerApp = existingApp;
    const updatedApp = {
      id:       'app1',
      metadata: { version: '2.0' },
      spec:     { config: 'b' },
      status:   { running: true }
    };

    mutations.updateControllerApp(state, updatedApp);
    expect(state.controllerApp).toEqual(updatedApp);
  });

  it('removeControllerApp nullifies controllerApp if id matches', () => {
    const app = {
      id:       'app1',
      metadata: {},
      spec:     {},
      status:   {}
    };

    state.controllerApp = app;
    mutations.removeControllerApp(state, app);
    expect(state.controllerApp).toBeNull();
  });

  it('updateKubewardenCrds adds a new CRD if it does not exist', () => {
    const crd = {
      metadata: { name: 'crd1' },
      spec:     { a: 1 },
      status:   {}
    };

    mutations.updateKubewardenCrds(state, crd);
    expect(state.kubewardenCrds).toContainEqual(crd);
  });

  it('updateKubewardenCrds updates an existing CRD if it exists', () => {
    const crd = {
      metadata: { name: 'crd1' },
      spec:     { a: 1 },
      status:   {}
    };

    state.kubewardenCrds.push(crd);
    const updatedCrd = {
      metadata: { name: 'crd1' },
      spec:     { a: 2 },
      status:   { updated: true }
    };

    mutations.updateKubewardenCrds(state, updatedCrd);
    expect(state.kubewardenCrds).toContainEqual(updatedCrd);
  });

  it('removeKubewardenCrds removes a CRD if it exists', () => {
    const crd = {
      metadata: { name: 'crd1' },
      spec:     {},
      status:   {}
    };

    state.kubewardenCrds.push(crd);
    mutations.removeKubewardenCrds(state, crd);
    expect(state.kubewardenCrds).not.toContain(crd);
  });

  it('updateLoadingReports sets loadingReports state', () => {
    mutations.updateLoadingReports(state, true);
    expect(state.loadingReports).toBe(true);
  });

  it('updateReportsBatch updates reports and reportMap', () => {
    // Setup initial policyReports and reportMap
    const report1 = {
      id:      'r1',
      scope:   { name: 'ns1' },
      results: [1],
      summary: {}
    };
    const report2 = {
      id:      'r2',
      scope:   { name: 'ns2' },
      results: [2],
      summary: {}
    };

    state.policyReports = [report1];
    state.reportMap = { ns1: report1 };

    // Create updated versions: update report1 and add report2
    const updatedReport1 = {
      id:      'r1',
      scope:   { name: 'ns1' },
      results: [10],
      summary: { total: 10 }
    };

    mutations.updateReportsBatch(state, {
      reportArrayKey: 'policyReports',
      updatedReports: [updatedReport1, report2]
    });

    expect(state.policyReports.find((r) => r.id === 'r1')).toEqual(updatedReport1);
    expect(state.policyReports.find((r) => r.id === 'r2')).toEqual(report2);

    const resourceId1 = updatedReport1.scope?.name || updatedReport1.id;
    const resourceId2 = report2.scope?.name || report2.id;

    expect(state.reportMap[resourceId1]).toEqual(updatedReport1);
    expect(state.reportMap[resourceId2]).toEqual(report2);
  });

  it('setSummaryMap merges new summary data into state.summaryMap', () => {
    state.summaryMap = {
      key1: {
        pass:  1,
        fail:  1,
        warn:  1,
        error: 1,
        skip:  1
      }
    };
    const newSummary = {
      key2: {
        pass:  2,
        fail:  2,
        warn:  2,
        error: 2,
        skip:  2
      }
    };

    mutations.setSummaryMap(state, newSummary);
    expect(state.summaryMap).toEqual({
      key1: {
        pass:  1,
        fail:  1,
        warn:  1,
        error: 1,
        skip:  1
      },
      key2: {
        pass:  2,
        fail:  2,
        warn:  2,
        error: 2,
        skip:  2
      }
    });
  });

  it('removePolicyReportById removes a policy report by id', () => {
    const report = { id: 'r1' };

    state.policyReports = [report];
    mutations.removePolicyReportById(state, 'r1');
    expect(state.policyReports).not.toContain(report);
  });

  describe('updatePolicyTraces', () => {
    it('adds a new policy trace object if none exists for the policyName', () => {
      const payload = {
        policyName:   'policy1',
        cluster:      'cluster1',
        updatedTrace: { id: 't1' }
      };

      mutations.updatePolicyTraces(state, payload);
      expect(state.policyTraces).toContainEqual({
        policyName: 'policy1',
        cluster:    'cluster1',
        traces:     [payload.updatedTrace]
      });
    });

    it('adds a new trace to an existing policy trace object if not found', () => {
      state.policyTraces = [{
        policyName: 'policy1',
        cluster:    'cluster1',
        traces:     [{ id: 't1' }]
      }];
      const payload = {
        policyName:   'policy1',
        cluster:      'cluster1',
        updatedTrace: { id: 't2' }
      };

      mutations.updatePolicyTraces(state, payload);
      const policyTrace = state.policyTraces.find((pt) => pt.policyName === 'policy1');

      expect(policyTrace.traces).toContainEqual({ id: 't1' });
      expect(policyTrace.traces).toContainEqual({ id: 't2' });
    });

    it('updates an existing trace if it exists', () => {
      state.policyTraces = [{
        policyName: 'policy1',
        cluster:    'cluster1',
        traces:     [{
          id:    't1',
          value: 'old'
        }]
      }];
      const payload = {
        policyName:   'policy1',
        cluster:      'cluster1',
        updatedTrace: {
          id:    't1',
          value: 'new'
        }
      };

      mutations.updatePolicyTraces(state, payload);
      const policyTrace = state.policyTraces.find((pt) => pt.policyName === 'policy1');

      expect(policyTrace.traces).toContainEqual({
        id:    't1',
        value: 'new'
      });
    });
  });

  describe('removeTraceById', () => {
    it('removes a trace by id from an existing policy trace object', () => {
      state.policyTraces = [{
        policyName: 'policy1',
        cluster:    'cluster1',
        traces:     [{ id: 't1' }, { id: 't2' }]
      }];
      mutations.removeTraceById(state, { policyName: 'policy1' }, { id: 't1' });
      const policyTrace = state.policyTraces.find((pt) => pt.policyName === 'policy1');

      expect(policyTrace.traces).not.toContainEqual({ id: 't1' });
      expect(policyTrace.traces).toContainEqual({ id: 't2' });
    });
  });

  it('updateRefreshingCharts sets refreshingCharts state', () => {
    mutations.updateRefreshingCharts(state, true);
    expect(state.refreshingCharts).toBe(true);
  });
});
