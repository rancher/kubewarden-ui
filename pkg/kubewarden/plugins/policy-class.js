import jsyaml from 'js-yaml';
import semver from 'semver';

import { colorForState, stateBackground, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { get } from '@shell/utils/object';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import { KUBERNETES, WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';

import { ARTIFACTHUB_ENDPOINT, ARTIFACTHUB_PKG_ANNOTATION, KUBEWARDEN_ANNOTATIONS, KUBEWARDEN_CHARTS, KUBEWARDEN_PRODUCT_NAME } from '../types';
import KubewardenModel, { colorForStatus } from './kubewarden-class';

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

    if (this.metadata?.annotations && KUBEWARDEN_ANNOTATIONS.some(key => this.metadata.annotations[key])) {
      return 'Policy Chart';
    }

    return 'Custom';
  }

  get stateDisplay() {
    const status = get(this, 'status.policyStatus');

    if ( status ) {
      return stateDisplay(status);
    }

    return stateDisplay();
  }

  get colorForState() {
    const status = get(this, 'status.policyStatus');

    if ( status ) {
      return colorForStatus(status);
    }

    return colorForState(this.state);
  }

  get stateBackground() {
    const color = this.colorForState;

    if ( color ) {
      return color.replace('text-', 'bg-');
    }

    return stateBackground();
  }

  /**
   * If a the policy is from ArtifactHub we need to fetch the questions that correspond to the
   * version of the policy. This is saved as an annotation on the policy.
  */
  get artifactHubPackageVersion() {
    return () => {
      if ( !this.artifactHubWhitelist ) {
        return { error: 'ArtifactHub.io has not been added to the `management.cattle.io.settings/whitelist-domain` setting' };
      }

      try {
        const pkgAnnotation = this.metadata?.annotations?.[ARTIFACTHUB_PKG_ANNOTATION];

        if ( pkgAnnotation ) {
          const url = `/meta/proxy/${ ARTIFACTHUB_ENDPOINT }/packages/kubewarden/${ pkgAnnotation }`;

          return this.$dispatch('management/request', { url, redirectUnauthorized: false }, { root: true });
        }
      } catch (e) {
        console.warn(`Error fetching pkg version: ${ e }`); // eslint-disable-line no-console
      }
    };
  }

  /** Parse provided yaml into workable json - returns js object */
  parsePackageMetadata(data) {
    if ( data ) {
      const parsed = JSON.parse(JSON.stringify(data));

      return jsyaml.load(parsed);
    }

    return null;
  }
}
