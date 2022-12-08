import isEmpty from 'lodash/isEmpty';

import { POD, WORKLOAD_TYPES } from '@shell/config/types';

import KubewardenModel, { colorForTraceStatus } from '../plugins/kubewarden/policy-class';
import { ADMISSION_POLICY_STATE } from '../config/kubewarden';
import { KUBEWARDEN } from '../types';

export const RELATED_HEADERS = [
  ADMISSION_POLICY_STATE,
  {
    name:   'name',
    value:  'metadata.name',
    label:  'Name',
    sort:   'name:desc'
  },
  {
    name:   'module',
    value:  'spec.module',
    label:  'Module',
    sort:   'module'
  },
  {
    name:   'mode',
    value:  'spec.mode',
    label:  'Mode',
    sort:   'mode'
  },
  {
    name:      'psCreated',
    label:     'Created',
    value:     'metadata.creationTimestamp',
    formatter: 'LiveDate'
  }
];

export const VALUES_STATE = {
  FORM: 'FORM',
  YAML: 'YAML',
};

export const YAML_OPTIONS = [
  {
    labelKey: 'catalog.install.section.chartOptions',
    value:    VALUES_STATE.FORM,
  },
  {
    labelKey: 'catalog.install.section.valuesYaml',
    value:    VALUES_STATE.YAML,
  }
];

export default class PolicyServer extends KubewardenModel {
  get _availableActions() {
    const out = super._availableActions;

    const logs = {
      action:  'openLogs',
      enabled: true,
      icon:    'icon icon-fw icon-chevron-right',
      label:   'View Logs',
    };

    out.unshift(logs);

    return out;
  }

  get allRelatedPolicies() {
    return async() => {
      const inStore = this.$rootGetters['currentProduct'].inStore;
      const types = [KUBEWARDEN.ADMISSION_POLICY, KUBEWARDEN.CLUSTER_ADMISSION_POLICY];
      const promises = types.map(type => this.$dispatch(`${ inStore }/findAll`, { type, opt: { force: true } }, { root: true }));

      try {
        const out = await Promise.all(promises);

        if ( out ) {
          return out.flatMap(o => o).filter(f => f.spec?.policyServer === this.metadata?.name);
        }
      } catch (e) {
        console.warn(`Error fetching related policies: ${ e }`); // eslint-disable-line no-console
      }
    };
  }

  get policyGauges() {
    return async() => {
      const out = {};
      const relatedPolicies = await this.allRelatedPolicies();

      if ( !relatedPolicies ) {
        return out;
      }

      relatedPolicies?.map((policy) => {
        const { colorForState, stateDisplay } = policy;

        if ( out[stateDisplay] ) {
          out[stateDisplay].count++;
        } else {
          out[stateDisplay] = {
            color: colorForState.replace('text-', ''),
            count: 1
          };
        }
      });

      return out;
    };
  }

  get tracesGauges() {
    return (traces) => {
      const out = {};

      if ( isEmpty(traces) ) {
        return out;
      }

      traces?.map((trace) => {
        const { allowed, mode, mutated } = trace;

        if ( mode === 'monitor' ) {
          return;
        }

        if ( out['Denied'] && !allowed ) {
          out['Denied'].count++;
        } else if ( !allowed ) {
          out['Denied'] = {
            color: colorForTraceStatus('denied'),
            count: 1
          };
        } else if ( out['Mutated'] && mutated ) {
          out['Mutated'].count++;
        } else if ( mutated && allowed ) {
          out['Mutated'] = {
            color: colorForTraceStatus('mutated'),
            count: 1
          };
        }
      });

      return out;
    };
  }

  get filteredValidations() {
    return async({ service }) => {
      const vals = await this.jaegerValidations({ jaegerService: service });

      const traces = this.traceTableRows(vals);
      const serviceName = `${ this.spec?.serviceAccountName }-${ this.metadata?.name }`;

      return traces.filter(trace => trace.host.includes(serviceName));
    };
  }

  get matchingDeployment() {
    return async() => {
      try {
        const inStore = this.$rootGetters['currentProduct'].inStore;

        return await this.$dispatch(`${ inStore }/findMatching`, {
          type:     WORKLOAD_TYPES.DEPLOYMENT,
          selector: `kubewarden/policy-server=${ this.metadata?.name }`
        }, { root: true });
      } catch (e) {
        console.warn('Error matching policy-server to deployment', e); // eslint-disable-line no-console
      }
    };
  }

  get matchingPods() {
    return async() => {
      try {
        const inStore = this.$rootGetters['currentProduct'].inStore;

        return await this.$dispatch(`${ inStore }/findMatching`, {
          type:     POD,
          selector: `app=kubewarden-policy-server-${ this.metadata?.name }` // kubewarden-policy-server is hardcoded from the kubewarden-controller
        }, { root: true });
      } catch (e) {
        console.warn('Error matching policy-server to pod', e); // eslint-disable-line no-console
      }
    };
  }

  jaegerPolicyNameByPolicy(policy) {
    let out = null;

    switch (policy.type) {
    case KUBEWARDEN.CLUSTER_ADMISSION_POLICY:
      out = `clusterwide-${ policy.metadata?.name }`;
      break;

    case KUBEWARDEN.ADMISSION_POLICY:
      out = `namespaced-${ policy.metadata?.namespace }-${ policy.metadata?.name }`;
      break;

    default:
      break;
    }

    return out;
  }

  async openLogs() {
    try {
      const pod = await this.matchingPods();

      if ( !isEmpty(pod) ) {
        this.$dispatch('wm/open', {
          id:        `${ this.id }-logs`,
          label:     this.nameDisplay,
          icon:      'file',
          component: 'ContainerLogs',
          attrs:     { pod: pod[0] }
        }, { root: true });
      }
    } catch (e) {
      console.warn('Error dispatching console for pod', e); // eslint-disable-line no-console
    }
  }
}
