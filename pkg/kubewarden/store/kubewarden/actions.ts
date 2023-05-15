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
  }
};
