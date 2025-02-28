import {
  CatalogApp, ClusterPolicyReport, CustomResourceDefinition, PolicyReport, PolicyTrace, PolicyTraceConfig, PolicyReportSummary
} from '../../types';
import { StateConfig } from './index';

type ReportKeys = 'policyReports' | 'clusterPolicyReports';

export default {
  updateAirGapped(state: StateConfig, val: boolean) {
    state.airGapped = val;
  },
  updateHideBannerDefaults(state: StateConfig, val: boolean) {
    state.hideBannerDefaults = val;
  },
  updateHideBannerOfficialRepo(state: StateConfig, val: boolean) {
    state.hideBannerOfficialRepo = val;
  },
  updateHideBannerPolicyRepo(state: StateConfig, val: boolean) {
    state.hideBannerPolicyRepo = val;
  },
  updateHideBannerAirgapPolicy(state: StateConfig, val: boolean) {
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
    const existingCrd = state.kubewardenCrds.find((c) => c?.metadata?.name === crd?.metadata?.name);

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
    const idx = state.kubewardenCrds.findIndex((c) => c?.metadata?.name === crd?.metadata?.name);

    if ( idx !== -1 ) {
      state.kubewardenCrds.splice(idx, 1);
    }
  },

  /**
   * Updates loading state of Policy Reports
   * @param state
   * @param val `boolean`
   */
  updateLoadingReports(state: StateConfig, val: boolean) {
    state.loadingReports = val;
  },

  /**
   * Updates/Adds Policy Reports to state
   * @param state
   * @param updatedReports `PolicyReport[] | ClusterPolicyReport[]`
   */
  updateReportsBatch<T extends PolicyReport | ClusterPolicyReport>(
    state: StateConfig,
    { reportArrayKey, updatedReports }: { reportArrayKey: ReportKeys, updatedReports: T[] }
  ): void {
    const reportArray = state[reportArrayKey] as Array<T>;

    // Convert array to a Map for O(1) lookups
    const reportMap = new Map(reportArray.map((report) => {
      const resourceId = report.scope?.namespace ? `${ report.scope.namespace }/${ report.scope.name }` : report.scope?.name || report.id;

      return [resourceId, report];
    }));

    updatedReports.forEach((updatedReport) => {
      const updatedId = updatedReport.scope?.namespace ? `${ updatedReport.scope.namespace }/${ updatedReport.scope.name }` : updatedReport.scope?.name || updatedReport.id;

      if (reportMap.has(updatedId)) {
        // Directly update the object reference
        Object.assign(reportMap.get(updatedId)!, {
          results: updatedReport.results,
          summary: updatedReport.summary,
        });
      } else {
        reportArray.push(updatedReport);
        reportMap.set(updatedId, updatedReport); // Keep map in sync
      }
    });

    state.reportMap = {
      ...state.reportMap,
      ...Object.fromEntries(reportMap)
    };
  },

  /**
   * Updates/Adds Policy Report summaries to state
   * @param state
   * @param newSummary `Record<string, PolicyReportSummary>`
   */
  setSummaryMap(state: StateConfig, newSummary: Record<string, PolicyReportSummary>) {
    state.summaryMap = {
      ...state.summaryMap,
      ...newSummary
    };
  },

  /**
   * Searches and then removes a report by id from the store
   * @param state
   * @param reportId
   */
  removePolicyReportById(state: StateConfig, reportId: string) {
    const idx = state.policyReports.findIndex((report) => report.id === reportId);

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

  updateRefreshingCharts(state: StateConfig, val: boolean) {
    state.refreshingCharts = val;
  }
};
