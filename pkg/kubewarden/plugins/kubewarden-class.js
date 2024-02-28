import filter from 'lodash/filter';
import matches from 'lodash/matches';
import isEmpty from 'lodash/isEmpty';
import semver from 'semver';

import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { MANAGEMENT, SERVICE } from '@shell/config/types';
import { isArray } from '@shell/utils/array';
import { addParams } from '@shell/utils/url';

import {
  KUBEWARDEN,
  RANCHER_NAMESPACES,
  RANCHER_NS_MATCH_EXPRESSION,
  ARTIFACTHUB_ENDPOINT,
  VALIDATION_KEYS
} from '../types';

export default class KubewardenModel extends SteveModel {
  async allServices() {
    const services = this.$rootGetters['cluster/all'](SERVICE);

    if ( !isEmpty(services) ) {
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
      s => s.id === 'whitelist-domain'
    );
  }

  /*
    Fetches all of the packages from the kubewarden org
  */
  get artifactHubRepo() {
    return async() => {
      let url = '/meta/proxy/';
      const packages = 'packages/search';
      const params = {
        kind:               13, // Kind for Kubewarden policies
        limit:              50 // limit to 50, default is 20
      };

      url += `${ ARTIFACTHUB_ENDPOINT }/${ packages }`;
      url = addParams(url, params);

      return await this.$dispatch(
        'management/request',
        { url, redirectUnauthorized: false },
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
          { url, redirectUnauthorized: false },
          { root: true }
        );
      } catch (e) {
        console.warn(`Error fetching pkg: ${ e }`); // eslint-disable-line no-console
      }
    };
  }

  get artifactHubWhitelist() {
    const whitelistValue = this.whitelistSetting?.value?.split(',');

    return whitelistValue.includes('artifacthub.io');
  }

  get certManagerService() {
    return async() => {
      try {
        return await this.$dispatch('cluster/findMatch', {
          type:     SERVICE,
          selector: 'app.kubernetes.io/instance=cert-manager'
        }, { root: true });
      } catch (e) {
        console.warn(`Error fetching cert-manager service: ${ e }`); // eslint-disable-line no-console
      }

      return null;
    };
  }

  // Determines if a policy is targeting rancher specific namespaces (which happens by default)
  get namespaceSelector() {
    const rancherNs = RANCHER_NAMESPACES.find(
      ns => ns === this.metadata?.namespace
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

  get policyTypes() {
    const out = Object.values(KUBEWARDEN.SPOOFED);

    return out;
  }

  haveComponent(name) {
    try {
      require.resolve(`../chart/${ name }`);

      return true;
    } catch (e) {
      return false;
    }
  }

  importComponent(name) {
    if (!name) {
      throw new Error('Name required');
    }

    return () => import(/* webpackChunkName: "chart" */ `../chart/${ name }`);
  }

  traceTableRows(traces) {
    let traceArray = [];

    // If a policy is in monitor mode it will pass multiple trace objects
    if (isArray(traces)) {
      traceArray = [
        ...new Map(traces.map(trace => [trace['traceID'], trace])).values(),
      ];
    } else {
      Object.assign(traceArray, traces?.data);
    }

    const out = traceArray.flatMap((trace) => {
      const eSpan = trace.spans?.find(s => s.operationName === 'policy_eval'); // policy in Monitor mode evaluation span
      const vSpan = trace.spans?.find(s => s.operationName === 'validation'); // policy in Protect mode validation span

      if (vSpan) {
        const date = new Date(vSpan.startTime / 1000);
        const duration = vSpan.duration / 1000;

        vSpan.startTime = date.toUTCString();
        vSpan.duration = duration.toFixed(2);

        const logs = {};
        let mode = 'protect'; // defaults to Protect mode for "Mode" trace header

        // 'policy_eval' logs will only exist when a policy is in monitor mode
        if (eSpan.logs.length > 0) {
          mode = 'monitor';

          const fields = eSpan.logs.flatMap(log => log.fields);

          fields.map((f) => {
            if (f.key === 'response') {
              Object.assign(logs, { [f.key]: f.value });
            }
          });
        }

        const tags = VALIDATION_KEYS.map(vKey => vSpan.tags.find(tag => tag.key === vKey)
        );

        return tags?.reduce(
          (tag, item) => ({
            ...vSpan,
            ...tag,
            [item?.key]: item?.value,
            mode,
            logs,
          }),
          {}
        );
      }

      return null;
    });

    return out;
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
      const out = whitelistValue.filter(domain => domain !== url);

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

export function getLatestStableVersion(versions) {
  const allVersions = versions.map(v => v.version);
  const stableVersions = versions.filter(v => !v.version.includes('rc'));

  if ( isEmpty(stableVersions) && !isEmpty(allVersions) ) {
    return semver.rsort(allVersions)[0];
  }

  return stableVersions?.sort((a, b) => {
    const versionA = a.version.split('.').map(Number);
    const versionB = b.version.split('.').map(Number);

    for ( let i = 0; i < Math.max(versionA.length, versionB.length); i++ ) {
      if ( versionA[i] === undefined || versionA[i] < versionB[i] ) {
        return 1;
      }
      if ( versionB[i] === undefined || versionA[i] > versionB[i] ) {
        return -1;
      }
    }

    return 0;
  })[0];
}
