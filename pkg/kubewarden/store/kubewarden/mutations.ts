import {
  CatalogApp, CustomResourceDefinition, PolicyReport, PolicyTrace, PolicyTraceConfig
} from '../../types';
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
   * Updates/Adds Kubewarden Controller App into state
   * @param state
   * @param app `CatalogApp`
   */
  updateControllerApp(state: StateConfig, app: CatalogApp) {
    if ( state.controllerApp?.id === app?.id ) {
      state.controllerApp.metadata = app.metadata;
      state.controllerApp.spec = app.spec;
      state.controllerApp.status = app.status;
    } else {
      state.controllerApp = app;
    }
  },

  /**
   * Removes Kubewarden Controller App by ID
   * @param state
   * @param app `CatalogApp`
   */
  removeControllerApp(state: StateConfig, app: CatalogApp) {
    const existing = state.controllerApp?.id === app?.id;

    if ( existing ) {
      state.controllerApp = null;
    }
  },

  /**
   * Updates/Adds CRD to state
   * @param state
   * @param crd `CustomResourceDefinition`
   */
  updateKubewardenCrds(state: StateConfig, crd: CustomResourceDefinition) {
    const existingCrd = state.kubewardenCrds.find(c => c?.metadata?.name === crd?.metadata?.name);

    if ( existingCrd ) {
      existingCrd.metadata = crd.metadata;
      existingCrd.spec = crd.spec;
      existingCrd.status = crd.status;
    } else {
      state.kubewardenCrds.push(crd);
    }
  },

  /**
   * Removes CRD from state by `crd.metadata.name`
   * @param state
   * @param crd `CustomResourceDefinition`
   */
  removeKubewardenCrds(state: StateConfig, crd: CustomResourceDefinition) {
    const idx = state.kubewardenCrds.findIndex(c => c?.metadata?.name === crd?.metadata?.name);

    if ( idx !== -1 ) {
      state.kubewardenCrds.splice(idx, 1);
    }
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
  },

  /**
   * Finds the existing policy object and adds the related traces.
   * @param state
   * @param policy
   * @param updatedTrace
   */
  updatePolicyTraces(state: StateConfig, val: { policyName: string, cluster: string, updatedTrace: PolicyTrace }) {
    const { policyName, cluster, updatedTrace } = val;
    const existingPolicyObj = state.policyTraces.find((traceObj: PolicyTraceConfig) => traceObj.policyName === policyName);
    let existingTrace = existingPolicyObj?.traces.find((trace: PolicyTrace) => trace.id === updatedTrace.id);

    if ( existingTrace ) {
      existingTrace = updatedTrace;
    } else if ( !existingPolicyObj ) {
      state.policyTraces.push({
        policyName,
        cluster,
        traces: [updatedTrace]
      });
    } else {
      // If the trace doesn't exist, add it to the store
      existingPolicyObj?.traces.push(updatedTrace);
    }
  },
  /**
   * Searches for the existing policy object and removes a trace by the traceID from the store
   * @param state
   * @param policy
   * @param updatedTrace
   */
  removeTraceById(state: StateConfig, policy: PolicyTraceConfig, updatedTrace: PolicyTrace) {
    const existingPolicyObj = state.policyTraces.find((traceObj: PolicyTraceConfig) => traceObj.policyName === policy.policyName);
    const idx = existingPolicyObj?.traces.findIndex((trace: PolicyTrace) => trace.id === updatedTrace.id);

    if ( idx && idx !== -1 ) {
      existingPolicyObj?.traces.splice(idx, 1);
    }
  },

  updateRefreshingCharts(state: StateConfig, val: Boolean) {
    state.refreshingCharts = val;
  }
};
