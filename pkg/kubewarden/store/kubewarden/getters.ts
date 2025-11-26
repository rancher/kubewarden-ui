import {
  CatalogApp,
  CustomResourceDefinition,
  Report,
  ClusterReport,
  PolicyTraceConfig,
  ReportSummary,
  ArtifactHubPackageDetails
} from '@kubewarden/types';
import { StateConfig } from './index';

export default {
  airGapped:              (state: StateConfig): boolean => state.airGapped,
  hideBannerDefaults:     (state: StateConfig): boolean => state.hideBannerDefaults,
  // hideBannerArtifactHub:  (state: StateConfig): boolean => state.hideBannerArtifactHub,
  hideBannerAirgapPolicy: (state: StateConfig): boolean => state.hideBannerAirgapPolicy,
  controllerApp:          (state: StateConfig): CatalogApp | null => state.controllerApp,
  kubewardenCrds:         (state: StateConfig): CustomResourceDefinition[] => state.kubewardenCrds,
  loadingReports:         (state: StateConfig): boolean => state.loadingReports,
  reports:          (state: StateConfig): Report[] => state.reports,
  clusterReports:   (state: StateConfig): ClusterReport[] => state.clusterReports,
  policyTraces:           (state: StateConfig): PolicyTraceConfig[] => state.policyTraces,
  refreshingCharts:       (state: StateConfig): boolean => state.refreshingCharts,
  packages:               (state: StateConfig): any[] => state.packages,
  loadingPackages:        (state: StateConfig): boolean => state.loadingPackages,
  packageDetailsByKey:    (state: StateConfig) => (key: string): ArtifactHubPackageDetails => state.packageDetails[key],


  reportByResourceId:     (state: StateConfig) => (resourceId: string): Report | ClusterReport => {
    return state.reportMap[resourceId];
  },

  summaryByResourceId:    (state: StateConfig) => (resourceId: string): ReportSummary => {
    return state.summaryMap[resourceId] || {
      pass:  0,
      fail:  0,
      warn:  0,
      error: 0,
      skip:  0
    };
  },
};
