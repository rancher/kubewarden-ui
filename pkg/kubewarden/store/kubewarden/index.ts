import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import {
  KUBEWARDEN_PRODUCT_NAME,
  CatalogApp,
  CustomResourceDefinition,
  FleetGitRepo,
  PolicyReport,
  PolicyTraceConfig,
  ClusterPolicyReport,
  PolicyReportSummary,
} from '../../types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

export interface StateConfig {
  airGapped: boolean;
  fleetRepos: FleetGitRepo[];
  hideBannerDefaults: boolean;
  hideBannerPolicyRepo: boolean;
  hideBannerOfficialRepo: boolean;
  hideBannerAirgapPolicy: boolean;
  controllerApp: CatalogApp | null;
  kubewardenCrds: CustomResourceDefinition[];
  loadingReports: boolean;
  policyReports: PolicyReport[];
  clusterPolicyReports: ClusterPolicyReport[];
  reportMap: Record<string, PolicyReport | ClusterPolicyReport>;
  summaryMap: Record<string, PolicyReportSummary>;
  policyTraces: PolicyTraceConfig[];
  refreshingCharts: boolean;
}

const kubewardenFactory = (config: StateConfig): CoreStoreSpecifics => {
  return {
    state: (): StateConfig => {
      return {
        airGapped:              config.airGapped,
        fleetRepos:             config.fleetRepos,
        hideBannerDefaults:     config.hideBannerDefaults,
        hideBannerOfficialRepo: config.hideBannerOfficialRepo,
        hideBannerPolicyRepo:   config.hideBannerPolicyRepo,
        hideBannerAirgapPolicy: config.hideBannerAirgapPolicy,
        controllerApp:          config.controllerApp,
        kubewardenCrds:         config.kubewardenCrds,
        loadingReports:         config.loadingReports,
        policyReports:          config.policyReports,
        clusterPolicyReports:   config.clusterPolicyReports,
        reportMap:              config.reportMap,
        summaryMap:             config.summaryMap,
        policyTraces:           config.policyTraces,
        refreshingCharts:       config.refreshingCharts
      };
    },

    getters:   { ...getters },
    mutations: { ...mutations },
    actions:   { ...actions },
  };
};

const config: CoreStoreConfig = { namespace: KUBEWARDEN_PRODUCT_NAME };

export default {
  specifics: kubewardenFactory({
    airGapped:              false,
    fleetRepos:             [],
    hideBannerDefaults:     false,
    hideBannerOfficialRepo: false,
    hideBannerPolicyRepo:   false,
    hideBannerAirgapPolicy: false,
    controllerApp:          null,
    kubewardenCrds:         [],
    loadingReports:         false,
    policyReports:          [],
    clusterPolicyReports:   [],
    reportMap:              {},
    summaryMap:             {},
    policyTraces:           [],
    refreshingCharts:       false
  }),
  config
};
