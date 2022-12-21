<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { WORKLOAD_TYPES } from '@shell/config/types';
import { KUBERNETES } from '@shell/config/labels-annotations';
import { allHash } from '@shell/utils/promise';

import ConsumptionGauge from '@shell/components/ConsumptionGauge';

import { DASHBOARD_HEADERS } from '../../config/table-headers';
import { KUBEWARDEN } from '../../types';

import Card from './Card';

export default {
  components: { Card, ConsumptionGauge },

  async fetch() {
    const inStore = this.currentProduct.inStore;

    const hash = await allHash({
      controller:         this.$store.dispatch(`${ inStore }/findMatching`, { type: WORKLOAD_TYPES.DEPLOYMENT, selector: `${ KUBERNETES.MANAGED_NAME }=kubewarden-controller` }),
      psDeployments:      this.$store.dispatch(`${ inStore }/findMatching`, { type: WORKLOAD_TYPES.DEPLOYMENT, selector: 'kubewarden/policy-server' }),
      globalPolicies:     this.$store.dispatch(`${ inStore }/findAll`, { type: KUBEWARDEN.CLUSTER_ADMISSION_POLICY }),
      namespacedPolicies: this.$store.dispatch(`${ inStore }/findAll`, { type: KUBEWARDEN.ADMISSION_POLICY })
    });

    if ( !isEmpty(hash.controller) ) {
      this.controller = hash.controller[0];
    }

    if ( !isEmpty(hash.psDeployments) ) {
      this.psDeployments = hash.psDeployments;
    }
  },

  data() {
    const colorStops = {
      25: '--error', 50: '--warning', 70: '--info'
    };

    return {
      DASHBOARD_HEADERS,
      colorStops,

      controller:         null,
      psDeployments:      null
    };
  },

  computed: {
    ...mapGetters(['currentCluster', 'currentProduct']),

    deployments() {
      return this.psDeployments.reduce((ps, neu) => {
        return {
          running:       ps.running + ( neu.metadata.state.name === 'active' ? 1 : 0 ),
          stopped:       ps.stopped + ( neu.metadata.state.error ? 1 : 0 ),
          transitioning: ps.transitioning + ( neu.metadata.state.transitioning ? 1 : 0 ),
          total:         ps.total + 1
        };
      }, {
        running: 0, stopped: 0, transitioning: 0, total: 0
      });
    },

    globalPolicies() {
      return this.$store.getters[`${ this.currentProduct.inStore }/all`](KUBEWARDEN.CLUSTER_ADMISSION_POLICY);
    },

    globalGuages() {
      return this.getPolicyGauges(this.globalPolicies);
    },

    namespacedPolicies() {
      return this.$store.getters[`${ this.currentProduct.inStore }/all`](KUBEWARDEN.ADMISSION_POLICY);
    },

    namespacedGuages() {
      return this.getPolicyGauges(this.namespacedPolicies);
    },

    version() {
      return this.controller?.metadata?.labels?.['app.kubernetes.io/version'];
    },
  },

  methods: {
    getPolicyGauges(type) {
      return type.reduce((policy, neu) => {
        return {
          status: {
            running: policy.status.running + ( neu.status.policyStatus === 'active' ? 1 : 0 ),
            stopped: policy.status.stopped + ( neu.status.error ? 1 : 0 ),
            pending: policy.status.pending + ( neu.status.policyStatus === 'pending' ? 1 : 0 ),
          },
          mode: {
            protect: policy.mode.protect + ( neu.spec.mode === 'protect' ? 1 : 0 ),
            monitor: policy.mode.monitor + ( neu.spec.mode === 'monitor' ? 1 : 0 )
          },
          total: policy.total + 1
        };
      }, {
        status: {
          running: 0, stopped: 0, pending: 0
        },
        mode:   { protect: 0, monitor: 0 },
        total:  0
      });
    }
  }
};
</script>

<template>
  <div class="dashboard">
    <div class="head">
      <div class="head-title">
        <h1>{{ t('kubewarden.dashboard.intro') }}</h1>
        <span v-if="version">{{ version }}</span>
      </div>

      <p class="head-subheader">
        {{ t('kubewarden.dashboard.blurb') }}
      </p>

      <p>
        {{ t('kubewarden.dashboard.description') }}
      </p>

      <div class="head-links">
        <a
          href="https://kubewarden.io/"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {{ t('kubewarden.dashboard.getStarted') }}
        </a>
        <a
          href="https://github.com/kubewarden/kubewarden-controller/issues"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {{ t('kubewarden.dashboard.issues') }}
        </a>
      </div>
    </div>

    <div class="get-started">
      <div
        v-for="(card, index) in DASHBOARD_HEADERS"
        :key="index"
      >
        <Card v-if="card.isEnabled" :card="card">
          <!-- Policy Server deployments -->
          <span v-if="index === 0 && psDeployments">
            <slot>
              <ConsumptionGauge
                resource-name="Running"
                :color-stops="colorStops"
                :capacity="deployments.total"
                :used-as-resource-name="true"
                :used="deployments.running"
                units="Deployments"
              />
            </slot>
          </span>

          <!-- Admission Policies -->
          <span v-if="index === 1">
            <slot>
              <ConsumptionGauge
                resource-name="Active"
                :color-stops="colorStops"
                :capacity="namespacedGuages.total"
                :used-as-resource-name="true"
                :used="namespacedGuages.status.running"
                units="Namespaced Policies"
              />
              <div class="mt-20">
                <h4>{{ t('kubewarden.dashboard.headers.modes.title') }}</h4>
                <span class="mr-20">{{ t('kubewarden.dashboard.headers.modes.protect') }}: {{ namespacedGuages.mode.protect }}</span>
                <span>{{ t('kubewarden.dashboard.headers.modes.monitor') }}: {{ namespacedGuages.mode.monitor }}</span>
              </div>
            </slot>
          </span>

          <!-- Cluster Admission Policies -->
          <span v-if="index === 2">
            <slot>
              <ConsumptionGauge
                resource-name="Active"
                :color-stops="colorStops"
                :capacity="globalGuages.total"
                :used-as-resource-name="true"
                :used="globalGuages.status.running"
                units="Global Policies"
              />
              <div class="mt-20">
                <h4>{{ t('kubewarden.dashboard.headers.modes.title') }}</h4>
                <span class="mr-20">{{ t('kubewarden.dashboard.headers.modes.protect') }}: {{ globalGuages.mode.protect }}</span>
                <span>{{ t('kubewarden.dashboard.headers.modes.monitor') }}: {{ globalGuages.mode.monitor }}</span>
              </div>
            </slot>
          </span>
        </Card>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;

  .head {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: $space-m;
    outline: 1px solid var(--border);
    border-radius: var(--border-radius);
    margin: 0 0 64px 0;
    padding: $space-m;
    gap: $space-m;

    &-title {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;

      h1 {
        margin: 0;
      }

      span {
        background: var(--primary);
        border-radius: var(--border-radius);
        padding: 4px 8px;
      }
    }

    &-subheader {
      font-size: 1.2rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    &-links {
      display: flex;
      gap: 10px;
    }
  }

  .get-started {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    grid-gap: 20px;
  }
}
</style>
