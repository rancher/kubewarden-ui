import { PolicyReport, PolicyTraceConfig } from '../../types';
import { StateConfig } from './index';

export default {
  airGapped:              (state: StateConfig): Boolean => state.airGapped,
  hideBannerDefaults:     (state: StateConfig): Boolean => state.hideBannerDefaults,
  hideBannerArtifactHub:  (state: StateConfig): Boolean => state.hideBannerArtifactHub,
  hideBannerAirgapPolicy: (state: StateConfig): Boolean => state.hideBannerAirgapPolicy,
  policyReports:          (state: StateConfig): PolicyReport[] => state.policyReports,
  policyTraces:           (state: StateConfig): PolicyTraceConfig[] => state.policyTraces
};
