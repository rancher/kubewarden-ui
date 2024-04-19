import jsyaml from 'js-yaml';

import { colorForState, stateBackground, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { get } from '@shell/utils/object';

import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import { ARTIFACTHUB_ENDPOINT, ARTIFACTHUB_PKG_ANNOTATION } from '../types';
import KubewardenModel, { colorForStatus } from './kubewarden-class';

export default class PolicyModel extends KubewardenModel {
  get _availableActions() {
    const out = super._availableActions;

    const policyMode = {
      action:  this.isKubewardenDefaultPolicy ? 'kwDefaultEditPolicyMode' : 'toggleUpdateMode',
      enabled: this.spec.mode === 'monitor',
      icon:    'icon icon-fw icon-notifier',
      label:   'Update Mode',
    };

    out.unshift(policyMode);

    return out;
  }

  kwDefaultEditPolicyMode() {
    this.currentRouter().push(this.kubewardenDefaultsRoute);
  }

  get kubewardenDefaultsRoute() {
    let version = '';
    const cluster = this.$rootGetters['currentCluster']?.id || '_';
    const helmChart = this.metadata?.labels?.['helm.sh/chart'] || '';

    if (helmChart && helmChart.includes('-')) {
      const arr = helmChart.split('-');

      if (arr[arr.length - 1].includes('rc')) {
        version = `${ arr[arr.length - 2] }-${ arr[arr.length - 1] }`;
      } else {
        version = arr[arr.length - 1];
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

  get isKubewardenDefaultPolicy() {
    return this.metadata?.labels?.['app.kubernetes.io/managed-by'] === 'Helm' &&
    this.metadata?.labels?.['app.kubernetes.io/name'] === 'kubewarden-defaults' &&
    this.metadata?.labels?.['app.kubernetes.io/part-of'] === 'kubewarden';
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
