import semver from 'semver';

import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import { KUBERNETES, WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';

import { KUBEWARDEN_ANNOTATIONS, KUBEWARDEN_CHARTS, KUBEWARDEN_PRODUCT_NAME } from '../types';
import KubewardenModel from './kubewarden-class';

export default class PolicyModel extends KubewardenModel {
  get _availableActions() {
    let out = super._availableActions;

    const policyMode = {
      action:  'toggleUpdateMode',
      enabled: this.spec.mode === 'monitor',
      icon:    'icon icon-fw icon-notifier',
      label:   'Update Mode',
    };

    out.unshift(policyMode);

    // Filter out actions if deployed with fleet
    if ( this.isDeployedWithFleet ) {
      const fleetActions = ['goToEdit', 'goToEditYaml', 'toggleUpdateMode'];

      out = out.filter(action => !fleetActions.includes(action.action));
    }

    return out;
  }

  get kubewardenDefaultsRoute() {
    let version = '';
    const cluster = this.$rootGetters['currentCluster']?.id || '_';
    const helmChart = this.metadata?.labels?.['helm.sh/chart'] || '';

    if (helmChart) {
      const parts = helmChart.split('-');

      // Start checking from the end of the array to find a valid semver
      for (let i = parts.length - 1; i >= 0; i--) {
        const potentialVersion = parts.slice(i).join('-');

        if (semver.valid(potentialVersion)) {
          version = potentialVersion;
          break;
        }
      }

      const query = {
        [REPO_TYPE]: 'cluster',
        [REPO]:      'kubewarden-charts',
        [CHART]:     'kubewarden-defaults',
        [VERSION]:   version
      };
  
      return {
        name:   'c-cluster-apps-charts-install',
        params: { cluster },
        query,
      };
    }

    return null;
  }

  get isKubewardenDefaultPolicy() {
    const labels = this.metadata?.labels;
    const isManagedByHelm = labels?.[KUBERNETES.MANAGED_BY] === 'Helm';
    const isKubewardenDefaults = labels?.[KUBERNETES.MANAGED_NAME] === KUBEWARDEN_CHARTS.DEFAULTS;
    const isPartOfKubewarden = labels?.['app.kubernetes.io/part-of'] === KUBEWARDEN_PRODUCT_NAME;

    return isManagedByHelm && isKubewardenDefaults && isPartOfKubewarden;
  }

  get isDeployedWithFleet() {
    return this.metadata?.annotations?.[WORKSPACE_ANNOTATION] && !this.metadata?.annotations?.['objectset.rio.cattle.io/applied'];
  }

  get isApplied() {
    return this.metadata?.annotations?.['objectset.rio.cattle.io/applied'];
  }

  get source() {
    if (this.isKubewardenDefaultPolicy && !this.isDeployedWithFleet && !this.isApplied) {
      return 'kubewarden-defaults';
    }

    if (this.isDeployedWithFleet && !this.isApplied) {
      return 'Fleet';
    }

    if (this.metadata?.annotations && Object.values(KUBEWARDEN_ANNOTATIONS).some(key => this.metadata.annotations[key])) {
      return 'Policy Chart';
    }

    return 'Custom';
  }
}