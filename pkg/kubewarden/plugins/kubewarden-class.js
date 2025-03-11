import filter from 'lodash/filter';
import matches from 'lodash/matches';
import isEmpty from 'lodash/isEmpty';
import semver from 'semver';

import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { MANAGEMENT, SERVICE } from '@shell/config/types';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { addParams } from '@shell/utils/url';

import {
  RANCHER_NAMESPACES,
  RANCHER_NS_MATCH_EXPRESSION,
  ARTIFACTHUB_ENDPOINT
} from '../types';

export default class KubewardenModel extends SteveModel {
  async allServices() {
    const services = this.$rootGetters['cluster/all'](SERVICE);

    if (!isEmpty(services)) {
      return services;
    }

    return await this.$dispatch(
      'cluster/findAll',
      { type: SERVICE },
      { root: true }
    );
  }

  get detailPageHeaderBadgeOverride() {
    return this.status?.policyStatus;
  }

  get componentForBadge() {
    if (this.detailPageHeaderBadgeOverride) {
      return require(`../formatters/PolicyStatus.vue`).default;
    }

    return null;
  }

  get whitelistSetting() {
    return this.$rootGetters['management/all'](MANAGEMENT.SETTING).find(
      (s) => s.id === 'whitelist-domain'
    );
  }

  /*
    Fetches all of the packages from the kubewarden org
  */
  get artifactHubRepo() {
    return async({ offset = 0, limit = 60 } = {}) => {
      let url = '/meta/proxy/';
      const packages = 'packages/search';

      const params = {
        kind: 13, // Kubewarden policies
        limit, // Max limit is 60, default is 20.
        offset // Used for pagination
      };

      url += `${ ARTIFACTHUB_ENDPOINT }/${ packages }`;
      url = addParams(url, params);

      return await this.$dispatch(
        'management/request',
        {
          url,
          redirectUnauthorized: false
        },
        { root: true }
      );
    };
  }

  /*
    Necessary for retrieving detailed package info
  */
  get artifactHubPackage() {
    return (pkg) => {
      try {
        const url = `/meta/proxy/${ ARTIFACTHUB_ENDPOINT }/packages/kubewarden/${ pkg.repository.name }/${ pkg.name }`;

        return this.$dispatch(
          'management/request',
          {
            url,
            redirectUnauthorized: false
          },
          { root: true }
        );
      } catch (e) {
        console.warn(`Error fetching pkg: ${ e }`);
      }
    };
  }

  get artifactHubWhitelist() {
    const whitelistValue = this.whitelistSetting?.value?.split(',');

    return whitelistValue.includes('artifacthub.io');
  }

  // Determines if a policy is targeting rancher specific namespaces (which happens by default)
  get namespaceSelector() {
    const rancherNs = RANCHER_NAMESPACES.find(
      (ns) => ns === this.metadata?.namespace
    );
    const selector = filter(
      this.spec?.namespaceSelector?.matchExpressions,
      matches(RANCHER_NS_MATCH_EXPRESSION)
    );

    if (rancherNs || !selector) {
      return true;
    }

    return false;
  }

  haveComponent(name) {
    try {
      require.resolve(`../chart/${ name }`);

      return true;
    } catch (e) {
      console.warn(`Error loading component: ${ e }`);

      return false;
    }
  }

  importComponent(name) {
    if (!name) {
      throw new Error('Name required');
    }

    return () => import(/* webpackChunkName: "chart" */ `../chart/${ name }`);
  }

  toggleUpdateMode(resources = this) {
    this.$dispatch(
      'cluster/promptModal',
      {
        resources,
        component: 'UpdateModeDialog',
      },
      { root: true }
    );
  }

  updateWhitelist(url, remove) {
    const whitelist = this.whitelistSetting;
    const whitelistValue = whitelist?.value.split(',');

    if (remove && whitelistValue.includes(url)) {
      const out = whitelistValue.filter((domain) => domain !== url);

      whitelist.value = out.join();

      try {
        return whitelist.save();
      } catch (e) {
        const error = e?.data || e;

        this.$dispatch('growl/error', {
          title:   error._statusText,
          message: error.message,
          timeout: 5000,
        }, { root: true });
      }
    }

    if (!whitelistValue.includes(url)) {
      whitelistValue.push(url);

      whitelist.value = whitelistValue.join();

      try {
        return whitelist.save();
      } catch (e) {
        const error = e?.data || e;

        this.$dispatch('growl/error', {
          title:   error._statusText,
          message: error.message,
          timeout: 5000,
        }, { root: true });
      }
    }
  }
}

export function colorForStatus(status) {
  const lowStatus = status.toLowerCase();

  switch (lowStatus) {
  case 'unschedulable':
    return 'text-error';
  case 'pending':
    return 'text-info';
  case 'active':
    return 'text-success';
  default:
    break;
  }

  return 'text-warning'; // 'unscheduled' is the default state
}

export function colorForPolicyServerState(state) {
  for (const key of Object.keys(STATES_ENUM)) {
    if (state === STATES_ENUM[key]) {
      return STATES[STATES_ENUM[key]].color;
    }
  }

  return 'info';
}

export function stateSort(color, display) {
  const SORT_ORDER = {
    error:         1,
    warning:       2,
    info:          3,
    success:       4,
    ready:         5,
    notready:      6,
    transitioning: 7,
    other:         8,
  };

  color = color.replace(/^(text|bg)-/, '');

  return `${ SORT_ORDER[color] || SORT_ORDER['other'] } ${ display }`;
}

export function colorForTraceStatus(status) {
  switch (status) {
  case 'allowed':
    return 'success';
  case 'denied':
    return 'error';
  case 'mutated':
    return 'warning';
  default:
    break;
  }

  return 'success';
}

export function getLatestVersion(store, versions) {
  const showPreRelease = store.getters['prefs/get'](SHOW_PRE_RELEASE);

  const versionMap = versions?.map((v) => v.version)
    .filter((v) => showPreRelease ? v : !semver.prerelease(v));

  return semver.rsort(versionMap)[0];
}
