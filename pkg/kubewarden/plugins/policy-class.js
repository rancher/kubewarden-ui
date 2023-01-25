import jsyaml from 'js-yaml';

import { colorForState, stateBackground, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { get } from '@shell/utils/object';

import KubewardenModel, { ARTIFACTHUB_ENDPOINT, ARTIFACTHUB_PKG_ANNOTATION, colorForStatus } from './kubewarden-class';

export const DEFAULT_POLICY = {
  apiVersion: '',
  kind:       '',
  metadata:   {
    name:      '',
    namespace: ''
  },
  spec:       {
    policyServer: '',
    module:       '',
    rules:        [{
      apiGroups:   [],
      apiVersions: [],
      resources:   [],
      operations:  []
    }],
    contextAware: false,
    mutating:     false,
    settings:     {}
  }
};

export default class PolicyModel extends KubewardenModel {
  get _availableActions() {
    const out = super._availableActions;

    const policyMode = {
      action:  'toggleUpdateMode',
      enabled: this.spec.mode === 'monitor',
      icon:    'icon icon-fw icon-notifier',
      label:   'Update Mode',
    };

    out.unshift(policyMode);

    return out;
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

  /*
    If a the policy is from ArtifactHub we need to fetch the questions that correspond to the
    version of the policy. This is saved as an annotation on the policy.
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

  parsePackageMetadata(data) {
    if ( data ) {
      const parsed = JSON.parse(JSON.stringify(data));

      return jsyaml.load(parsed);
    }

    return null;
  }
}
