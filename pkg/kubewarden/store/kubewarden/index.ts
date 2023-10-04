import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import { KUBEWARDEN_PRODUCT_NAME, PolicyReport } from '../../types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

export interface StateConfig {
  airGapped: Boolean,
  hideBannerDefaults: Boolean,
  hideBannerArtifactHub: Boolean,
  hideBannerAirgapPolicy: Boolean,
  policyReports: PolicyReport[]
}

const kubewardenFactory = (config: StateConfig): CoreStoreSpecifics => {
  return {
    state: (): StateConfig => {
      return {
        airGapped:              config.airGapped,
        hideBannerDefaults:     config.hideBannerDefaults,
        hideBannerArtifactHub:  config.hideBannerArtifactHub,
        hideBannerAirgapPolicy: config.hideBannerAirgapPolicy,
        policyReports:          config.policyReports
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
    hideBannerDefaults:     false,
    hideBannerArtifactHub:  false,
    hideBannerAirgapPolicy: false,
    policyReports:          []
  }),
  config
};
