import {
  CatalogApp,
  CustomResourceDefinition,
  PolicyReport,
  ClusterPolicyReport,
  PolicyTraceConfig,
  ArtifactHubPackageDetails,
} from '../../types';
import { StateConfig } from './index';

export default {
  airGapped:              (state: StateConfig): Boolean => state.airGapped,
  hideBannerDefaults:     (state: StateConfig): Boolean => state.hideBannerDefaults,
  hideBannerArtifactHub:  (state: StateConfig): Boolean => state.hideBannerArtifactHub,
  hideBannerAirgapPolicy: (state: StateConfig): Boolean => state.hideBannerAirgapPolicy,
  controllerApp:          (state: StateConfig): CatalogApp | null => state.controllerApp,
  kubewardenCrds:         (state: StateConfig): CustomResourceDefinition[] => state.kubewardenCrds,
  policyReports:          (state: StateConfig): PolicyReport[] => state.policyReports,
  clusterPolicyReports:   (state: StateConfig): ClusterPolicyReport[] => state.clusterPolicyReports,
  policyTraces:           (state: StateConfig): PolicyTraceConfig[] => state.policyTraces,
  refreshingCharts:       (state: StateConfig): Boolean => state.refreshingCharts,
  packages:               (state: StateConfig): any[] => state.packages,
  loadingPackages:        (state: StateConfig): boolean => state.loadingPackages,
  packageDetailsByKey:    (state: StateConfig) => (key: string): ArtifactHubPackageDetails => state.packageDetails[key],
};
