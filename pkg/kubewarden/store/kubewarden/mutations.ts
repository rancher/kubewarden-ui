import { StateConfig } from './index';

export default {
  updateAirGapped(state: StateConfig, val: Boolean) {
    state.airGapped = val;
  },
  updateHideBannerDefaults(state: StateConfig, val: Boolean) {
    state.hideBannerDefaults = val;
  },
  updateHideBannerArtifactHub(state: StateConfig, val: Boolean) {
    state.hideBannerArtifactHub = val;
  },
  updateHideBannerAirgapPolicy(state: StateConfig, val: Boolean) {
    state.hideBannerAirgapPolicy = val;
  }
};
