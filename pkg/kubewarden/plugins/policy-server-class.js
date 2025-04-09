import isEmpty from 'lodash/isEmpty';

import { POD, WORKLOAD_TYPES } from '@shell/config/types';

import { KUBEWARDEN } from '@kubewarden/types';
import KubewardenModel, { colorForStatus, colorForTraceStatus } from './kubewarden-class';

export default class PolicyServerModel extends KubewardenModel {
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
      const types = [KUBEWARDEN.ADMISSION_POLICY, KUBEWARDEN.CLUSTER_ADMISSION_POLICY];
      const promises = types
        .filter((type) => this.$rootGetters['cluster/canList'](type))
        .map((type) => this.$dispatch('cluster/findAll', {
          type,
          opt: { force: true }
        }, { root: true }));

      try {
        const out = await Promise.all(promises);

        if (out) {
          return out.flatMap((o) => o).filter((f) => f.spec?.policyServer === this.metadata?.name);
        }
      } catch (e) {
        console.warn(`Error fetching related policies: ${ e }`);
      }
    };
  }

  get policyGauges() {
    return async() => {
      const out = {};
      const states = ['Active', 'Pending'];
      const relatedPolicies = await this.allRelatedPolicies();

      if (!relatedPolicies) {
        return out;
      }

      // Set defaults for gauges
      for (const stateType of states.values()) {
        if (!out[stateType]) {
          out[stateType] = {
            color: colorForStatus(stateType).replace('text-', ''),
            count: 0
          };
        }
      }

      // Add policy states to gauge
      relatedPolicies?.map((policy) => {
        const { stateDisplay } = policy;

        if (!out[stateDisplay]) {
          out[stateDisplay] = {
            color: colorForStatus(stateDisplay).replace('text-', ''),
            count: 0
          };
        } else {
          out[stateDisplay].count++;
        }
      });

      return out;
    };
  }

  get tracesGauges() {
    return (policyTraces) => {
      const out = {};

      if (isEmpty(policyTraces)) {
        return out;
      }

      policyTraces?.flatMap((policyObj) => {
        policyObj?.traces?.map((trace) => {
          const { allowed, mode, mutated } = trace;

          if (mode === 'monitor') {
            return;
          }

          if (out['Denied'] && !allowed) {
            out['Denied'].count++;
          } else if (!allowed) {
            out['Denied'] = {
              color: colorForTraceStatus('denied'),
              count: 1
            };
          } else if (out['Mutated'] && mutated) {
            out['Mutated'].count++;
          } else if (mutated && allowed) {
            out['Mutated'] = {
              color: colorForTraceStatus('mutated'),
              count: 1
            };
          }
        });
      });

      return out;
    };
  }

  get matchingDeployment() {
    return async() => {
      try {
        return await this.$dispatch('cluster/findMatching', {
          type:     WORKLOAD_TYPES.DEPLOYMENT,
          selector: `kubewarden/policy-server=${ this.metadata?.name }`
        }, { root: true });
      } catch (e) {
        console.warn('Error matching policy-server to deployment', e);
      }
    };
  }

  get matchingPods() {
    return async() => {
      try {
        const name = this.metadata?.name;
        const oldSelector = `app=kubewarden-policy-server-${ name }`;
        const newSelector = `app.kubernetes.io/instance=policy-server-${ name }`;

        const [podsOld, podsNew] = await Promise.all([
          this.$dispatch('cluster/findMatching', {
            type:     POD,
            selector: oldSelector
          }, { root: true }),
          this.$dispatch('cluster/findMatching', {
            type:     POD,
            selector: newSelector
          }, { root: true })
        ]);

        // Merge the two arrays and remove duplicates based on a unique identifier (e.g. metadata.uid)
        const podsMap = new Map();

        (podsOld || []).forEach((p) => podsMap.set(p?.metadata?.uid, p));
        (podsNew || []).forEach((p) => podsMap.set(p?.metadata?.uid, p));

        return Array.from(podsMap.values());
      } catch (e) {
        console.warn('Error matching policy-server to pod', e);
      }
    };
  }

  async openLogs() {
    try {
      const pod = await this.matchingPods();

      if (!isEmpty(pod)) {
        this.$dispatch('wm/open', {
          id:        `${ this.id }-logs`,
          label:     this.nameDisplay,
          icon:      'file',
          component: 'ContainerLogs',
          attrs:     { pod: pod[0] }
        }, { root: true });
      }
    } catch (e) {
      console.warn('Error dispatching console for pod', e);
    }
  }
}
