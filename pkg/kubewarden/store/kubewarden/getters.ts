import { StateConfig } from './index';

export default {
  airGapped:              (state: StateConfig): Boolean => state.airGapped,
  hideBannerDefaults:     (state: StateConfig): Boolean => state.hideBannerDefaults,
  hideBannerArtifactHub:  (state: StateConfig): Boolean => state.hideBannerArtifactHub,
  hideBannerAirgapPolicy: (state: StateConfig): Boolean => state.hideBannerAirgapPolicy
};
