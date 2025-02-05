import {
  CatalogApp, CustomResourceDefinition, PolicyReport, ClusterPolicyReport, PolicyTraceConfig, PolicyTrace
} from '../../types';

export default {
  updateAirGapped({ commit }: any, val: Boolean) {
    commit('updateAirGapped', val);
  },

  // Defaults banner
  updateHideBannerDefaults({ commit }: any, val: Boolean) {
    commit('updateHideBannerDefaults', val);
  },

  // ArtifactHub banner
  updateHideBannerArtifactHub({ commit }: any, val: Boolean) {
    commit('updateHideBannerArtifactHub', val);
  },
  updateHideBannerAirgapPolicy({ commit }: any, val: Boolean) {
    commit('updateHideBannerAirgapPolicy', val);
  },

  // Policy and Cluster Policy Reports
  updatePolicyReports({ commit }: any, updatedReports: PolicyReport[]) {
    commit('updateReportsBatch', { reportArrayKey: 'policyReports', updatedReports });
  },
  updateClusterPolicyReports({ commit }: any, updatedReports: ClusterPolicyReport[]) {
    commit('updateReportsBatch', { reportArrayKey: 'clusterPolicyReports', updatedReports });
  },

  // Policy traces
  updatePolicyTraces({ commit }: any, val: { policyName: string, updatedTrace: PolicyTrace }) {
    commit('updatePolicyTraces', val);
  },
  removePolicyTraceById({ commit }: any, policy: PolicyTraceConfig, trace: PolicyTrace) {
    commit('removePolicyTraceById', policy, trace);
  },

  // Charts
  updateRefreshingCharts({ commit }: any, val: Boolean) {
    commit('updateRefreshingCharts', val);
  },

  // Catalog
  updateControllerApp({ commit }: any, val: CatalogApp) {
    commit('updateControllerApp', val);
  },
  removeControllerApp({ commit }: any, val: CatalogApp) {
    commit('removeControllerApp', val);
  },
  updateKubewardenCrds({ commit }: any, val: CustomResourceDefinition) {
    commit('updateKubewardenCrds', val);
  },
  removeKubewardenCrds({ commit }: any, val: CustomResourceDefinition) {
    commit('removeKubewardenCrds', val);
  }
};
