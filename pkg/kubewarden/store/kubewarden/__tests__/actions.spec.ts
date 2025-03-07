import actions from '@kubewarden/store/kubewarden/actions';
import { generateSummaryMap } from '@kubewarden/modules/policyReporter';

jest.mock('@kubewarden/modules/policyReporter', () => ({ generateSummaryMap: jest.fn(() => ({ summary: 'testSummary' })) }));

describe('Vuex Actions', () => {
  let commit: jest.Mock;
  let state: any;

  beforeEach(() => {
    commit = jest.fn();
    state = { someState: true };
  });

  it('updateAirGapped should commit "updateAirGapped" with the provided value', () => {
    actions.updateAirGapped({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateAirGapped', true);
  });

  it('updateHideBannerDefaults should commit "updateHideBannerDefaults" with the provided value', () => {
    actions.updateHideBannerDefaults({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateHideBannerDefaults', true);
  });

  it('updateHideBannerArtifactHub should commit "updateHideBannerArtifactHub" with the provided value', () => {
    actions.updateHideBannerArtifactHub({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateHideBannerArtifactHub', true);
  });

  it('updateHideBannerAirgapPolicy should commit "updateHideBannerAirgapPolicy" with the provided value', () => {
    actions.updateHideBannerAirgapPolicy({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateHideBannerAirgapPolicy', true);
  });

  it('updateLoadingReports should commit "updateLoadingReports" with the provided value', () => {
    actions.updateLoadingReports({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateLoadingReports', true);
  });

  it('updatePolicyReports should commit "updateReportsBatch" with reportArrayKey "policyReports"', () => {
    const reports = [{
      id:      '1',
      results: []
    }];

    actions.updatePolicyReports({ commit }, reports);
    expect(commit).toHaveBeenCalledWith('updateReportsBatch', {
      reportArrayKey: 'policyReports',
      updatedReports: reports
    });
  });

  it('updateClusterPolicyReports should commit "updateReportsBatch" with reportArrayKey "clusterPolicyReports"', () => {
    const reports = [{
      id:      '2',
      results: []
    }];

    actions.updateClusterPolicyReports({ commit }, reports);
    expect(commit).toHaveBeenCalledWith('updateReportsBatch', {
      reportArrayKey: 'clusterPolicyReports',
      updatedReports: reports
    });
  });

  it('regenerateSummaryMap should call generateSummaryMap and commit "setSummaryMap"', async() => {
    const context = {
      state,
      commit
    };

    await actions.regenerateSummaryMap(context);
    expect(generateSummaryMap).toHaveBeenCalledWith(state);
    expect(commit).toHaveBeenCalledWith('setSummaryMap', { summary: 'testSummary' });
  });

  it('updatePolicyTraces should commit "updatePolicyTraces" with the given payload', () => {
    const payload = {
      policyName:   'testPolicy',
      cluster:      'testCluster',
      updatedTrace: { id: 'trace1' }
    };

    actions.updatePolicyTraces({ commit }, payload);
    expect(commit).toHaveBeenCalledWith('updatePolicyTraces', payload);
  });

  it('removePolicyTraceById should commit "removePolicyTraceById" with provided policy and trace', () => {
    const policy = { policyName: 'testPolicy' };
    const trace = { id: 'trace1' };

    actions.removePolicyTraceById({ commit }, policy, trace);
    expect(commit).toHaveBeenCalledWith('removePolicyTraceById', policy, trace);
  });

  it('updateRefreshingCharts should commit "updateRefreshingCharts" with the provided value', () => {
    actions.updateRefreshingCharts({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateRefreshingCharts', true);
  });

  it('updateControllerApp should commit "updateControllerApp" with the provided value', () => {
    const app = {
      id:       'app1',
      metadata: {},
      spec:     {},
      status:   {}
    };

    actions.updateControllerApp({ commit }, app);
    expect(commit).toHaveBeenCalledWith('updateControllerApp', app);
  });

  it('removeControllerApp should commit "removeControllerApp" with the provided value', () => {
    const app = {
      id:       'app1',
      metadata: {},
      spec:     {},
      status:   {}
    };

    actions.removeControllerApp({ commit }, app);
    expect(commit).toHaveBeenCalledWith('removeControllerApp', app);
  });

  it('updateKubewardenCrds should commit "updateKubewardenCrds" with the provided value', () => {
    const crd = {
      metadata: { name: 'crd1' },
      spec:     {},
      status:   {}
    };

    actions.updateKubewardenCrds({ commit }, crd);
    expect(commit).toHaveBeenCalledWith('updateKubewardenCrds', crd);
  });

  it('removeKubewardenCrds should commit "removeKubewardenCrds" with the provided value', () => {
    const crd = {
      metadata: { name: 'crd1' },
      spec:     {},
      status:   {}
    };

    actions.removeKubewardenCrds({ commit }, crd);
    expect(commit).toHaveBeenCalledWith('removeKubewardenCrds', crd);
  });
});
