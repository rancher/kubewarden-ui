import { PolicyReport } from '../../types';

export default {
  updateAirGapped({ commit }: any, val: Boolean) {
    commit('updateAirGapped', val);
  },
  updateHideBannerDefaults({ commit }: any, val: Boolean) {
    commit('updateHideBannerDefaults', val);
  },
  updateHideBannerArtifactHub({ commit }: any, val: Boolean) {
    commit('updateHideBannerArtifactHub', val);
  },
  updateHideBannerAirgapPolicy({ commit }: any, val: Boolean) {
    commit('updateHideBannerAirgapPolicy', val);
  },
  updatePolicyReports({ commit }: any, val: PolicyReport[]) {
    commit('updatePolicyReports', val);
  },
  removePolicyReportById({ commit }: any, val: PolicyReport) {
    commit('removePolicyReportById', val.id);
  }
};
