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
  KUBEWARDEN,
  RANCHER_NAMESPACES,
  RANCHER_NS_MATCH_EXPRESSION,
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
    if (Array.isArray(traces)) {
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
}

export function colorForStatus(status) {
  const lowStatus = status?.toLowerCase();

  if (!lowStatus || lowStatus === 'unknown') {
    return 'text-disabled';
  }

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
    if (typeof state === 'undefined') {
      return STATES['unknown'].color;
    }

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

  const versionMap = versions?.map(v => v.version)
    .filter(v => showPreRelease ? v : !semver.prerelease(v));

  return semver.rsort(versionMap)[0];
}