import {
  CatalogApp, CustomResourceDefinition, PolicyReport, ClusterPolicyReport, PolicyTraceConfig, PolicyTrace, PolicyReportSummary
} from '@kubewarden/types';
import { generateSummaryMap } from '@kubewarden/modules/policyReporter';

export default {
  updateAirGapped({ commit }: any, val: boolean) {
    commit('updateAirGapped', val);
  },

  // Defaults banner
  updateHideBannerDefaults({ commit }: any, val: boolean) {
    commit('updateHideBannerDefaults', val);
  },

  // ArtifactHub banner
  updateHideBannerArtifactHub({ commit }: any, val: boolean) {
    commit('updateHideBannerArtifactHub', val);
  },
  updateHideBannerAirgapPolicy({ commit }: any, val: boolean) {
    commit('updateHideBannerAirgapPolicy', val);
  },

  // Policy and Cluster Policy Reports
  updateLoadingReports({ commit }: any, val: boolean) {
    commit('updateLoadingReports', val);
  },

  updatePolicyReports({ commit }: any, updatedReports: PolicyReport[]) {
    commit('updateReportsBatch', {
      reportArrayKey: 'policyReports',
      updatedReports
    });
  },
  updateClusterPolicyReports({ commit }: any, updatedReports: ClusterPolicyReport[]) {
    commit('updateReportsBatch', {
      reportArrayKey: 'clusterPolicyReports',
      updatedReports
    });
  },

  async regenerateSummaryMap({ state, commit }: any) {
    const newSummary: Record<string, PolicyReportSummary> = generateSummaryMap(state);

    commit('setSummaryMap', newSummary);
  },

  // Policy traces
  updatePolicyTraces({ commit }: any, val: { policyName: string, updatedTrace: PolicyTrace }) {
    commit('updatePolicyTraces', val);
  },
  removePolicyTraceById({ commit }: any, policy: PolicyTraceConfig, trace: PolicyTrace) {
    commit('removePolicyTraceById', policy, trace);
  },

  // Charts
  updateRefreshingCharts({ commit }: any, val: boolean) {
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
