import filter from 'lodash/filter';
import matches from 'lodash/matches';
import isEmpty from 'lodash/isEmpty';
import semver from 'semver';

import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { SERVICE } from '@shell/config/types';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';

import {
  RANCHER_NAMESPACES,
  RANCHER_NS_MATCH_EXPRESSION
} from '@kubewarden/types';

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

  get certManagerService() {
    return async() => {
      try {
        return await this.$dispatch('cluster/findMatch', {
          type:     SERVICE,
          selector: 'app.kubernetes.io/instance=cert-manager'
        }, { root: true });
      } catch (e) {
        console.warn(`Error fetching cert-manager service: ${ e }`);
      }

      return null;
    };
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

  async showConfiguration(returnFocusSelector) {
    // Override showConfiguration to dynamically import the ResourceDetailDrawer
    const onClose = () => this.$ctx.commit('slideInPanel/close', undefined, { root: true });

    // Dynamically import the ResourceDetailDrawer component
    const ResourceDetailDrawer = await import('@shell/components/Drawer/ResourceDetailDrawer');

    this.$ctx.commit('slideInPanel/open', {
      component:      ResourceDetailDrawer.default,
      componentProps: {
        resource:           this,
        onClose,
        width:              '73%',
        // We want this to be full viewport height top to bottom
        height:             '100vh',
        top:                '0',
        'z-index':          101, // We want this to be above the main side menu
        closeOnRouteChange: ['name', 'params', 'query'], // We want to ignore hash changes, tables in extensions can trigger the drawer to close while opening
        triggerFocusTrap:   true,
        returnFocusSelector
      }
    }, { root: true });
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

  const versionMap = versions?.map((v) => v.version)
    .filter((v) => showPreRelease ? v : !semver.prerelease(v));

  return semver.rsort(versionMap)[0];
}
