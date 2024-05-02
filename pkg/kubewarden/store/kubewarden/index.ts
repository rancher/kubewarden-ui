import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import {
  KUBEWARDEN_PRODUCT_NAME,
  CatalogApp,
  CustomResourceDefinition,
  FleetGitRepo,
  PolicyReport,
  PolicyTraceConfig,
  ClusterPolicyReport
} from '../../types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

export interface StateConfig {
  airGapped: Boolean;
  fleetRepos: FleetGitRepo[];
  hideBannerDefaults: Boolean;
  hideBannerArtifactHub: Boolean;
  hideBannerAirgapPolicy: Boolean;
  controllerApp: CatalogApp | null;
  kubewardenCrds: CustomResourceDefinition[];
  policyReports: PolicyReport[];
  clusterPolicyReports: ClusterPolicyReport[];
  policyTraces: PolicyTraceConfig[];
  refreshingCharts: Boolean;
}

const kubewardenFactory = (config: StateConfig): CoreStoreSpecifics => {
  return {
    state: (): StateConfig => {
      return {
        airGapped:              config.airGapped,
        fleetRepos:             config.fleetRepos,
        hideBannerDefaults:     config.hideBannerDefaults,
        hideBannerArtifactHub:  config.hideBannerArtifactHub,
        hideBannerAirgapPolicy: config.hideBannerAirgapPolicy,
        controllerApp:          config.controllerApp,
        kubewardenCrds:         config.kubewardenCrds,
        policyReports:          config.policyReports,
        clusterPolicyReports:   config.clusterPolicyReports,
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
    hideBannerArtifactHub:  false,
    hideBannerAirgapPolicy: false,
    controllerApp:          null,
    kubewardenCrds:         [],
    policyReports:          [],
    clusterPolicyReports:   [],
    policyTraces:           [],
    refreshingCharts:       false
  }),
  config
};
