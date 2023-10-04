import { PolicyReport } from '../../types';
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
  },

  /**
   * Updates/Adds policy reports to the state
   * @param state
   * @param updatedReport - PolicyReport interface
   */
  updatePolicyReports(state: StateConfig, updatedReport: PolicyReport) {
    const existingReport = state.policyReports.find(report => report.id === updatedReport.id);

    if ( existingReport ) {
      // We only need to update the results and summary of the report
      existingReport.results = updatedReport.results;
      existingReport.summary = updatedReport.summary;
    } else {
      // If the report doesn't exist, add it to the store
      state.policyReports.push(updatedReport);
    }
  },

  /**
   * Searches and then removes a report by id from the store
   * @param state
   * @param reportId
   */
  removePolicyReportById(state: StateConfig, reportId: String) {
    const idx = state.policyReports.findIndex(report => report.id === reportId);

    if ( idx !== -1 ) {
      state.policyReports.splice(idx, 1);
    }
  }
};
