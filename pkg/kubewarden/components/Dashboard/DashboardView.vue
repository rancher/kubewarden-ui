<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { CATALOG, POD, WORKLOAD_TYPES } from '@shell/config/types';
import { KUBERNETES, CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { allHash } from '@shell/utils/promise';

import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import Loading from '@shell/components/Loading';

import { DASHBOARD_HEADERS } from '../../config/table-headers';
import { KUBEWARDEN, KUBEWARDEN_APPS, KUBEWARDEN_CHARTS } from '../../types';

import DefaultsBanner from '../DefaultsBanner';
import Card from './Card';

export default {
  components: {
    Card, ConsumptionGauge, DefaultsBanner, Loading
  },

  async fetch() {
    const inStore = this.currentProduct.inStore;

    const hash = await allHash({
      controller:         this.$store.dispatch(`${ inStore }/findMatching`, { type: WORKLOAD_TYPES.DEPLOYMENT, selector: `${ KUBERNETES.MANAGED_NAME }=${ KUBEWARDEN_CHARTS.CONTROLLER }` }),
      psPods:             this.$store.dispatch(`${ inStore }/findMatching`, { type: POD, selector: 'kubewarden/policy-server' }),
      globalPolicies:     this.$store.dispatch(`${ inStore }/findAll`, { type: KUBEWARDEN.CLUSTER_ADMISSION_POLICY }),
      namespacedPolicies: this.$store.dispatch(`${ inStore }/findAll`, { type: KUBEWARDEN.ADMISSION_POLICY }),
      apps:               this.$store.dispatch(`${ inStore }/findAll`, { type: CATALOG.APP })
    });

    if ( !isEmpty(hash.controller) ) {
      this.controller = hash.controller[0];
    }

    if ( !isEmpty(hash.apps) ) {
      this.apps = hash.apps;
    }
  },

  data() {
    const colorStops = {
      25: '--error', 50: '--warning', 70: '--info'
    };

    return {
      DASHBOARD_HEADERS,
      colorStops,

      apps:               null,
      controller:         null,
      psPods:      null,
    };
  },

  computed: {
    ...mapGetters(['currentCluster', 'currentProduct']),

    defaultsApp() {
      return this.apps?.find((a) => {
        return a.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_DEFAULTS;
      });
    },

    policyServerPods() {
      return this.$store.getters[`${ this.currentProduct.inStore }/all`]({ type: POD, selector: 'kubewarden/policy-server' });
    },

    policyServers() {
      const pods = this.policyServerPods || [];

      return pods.reduce((ps, neu) => {
        return {
          status: {
            running:       ps.status.running + ( neu.metadata.state.name === 'running' ? 1 : 0 ),
            stopped:       ps.status.stopped + ( neu.metadata.state.error ? 1 : 0 ),
            pending:       ps.status.transitioning + ( neu.metadata.state.transitioning ? 1 : 0 )
          },
          total: ps.total + 1
        };
      }, {
        status: {
          running: 0, stopped: 0, pending: 0
        },
        total: 0
      });
    },

    globalPolicies() {
      return this.$store.getters[`${ this.currentProduct.inStore }/all`](KUBEWARDEN.CLUSTER_ADMISSION_POLICY);
    },

    globalGuages() {
      return this.getPolicyGauges(this.globalPolicies);
    },

    hideDefaultsBanner() {
      return this.$store.getters['kubewarden/hideDefaultsBanner'] || !!this.defaultsApp;
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
  <Loading v-if="$fetchState.pending" />
  <div v-else class="dashboard">
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

    <DefaultsBanner v-if="!hideDefaultsBanner" />

    <div class="get-started">
      <div
        v-for="(card, index) in DASHBOARD_HEADERS"
        :key="index"
        class="card-container"
      >
        <Card v-if="card.isEnabled" :card="card">
          <!-- Policy Server pods -->
          <span v-if="index === 0">
            <slot>
              <ConsumptionGauge
                resource-name="Active"
                :color-stops="colorStops"
                :capacity="policyServers.total"
                :used-as-resource-name="true"
                :used="policyServers.status.running"
                units="Pods"
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

    .card-container {
      min-height: 420px;
      padding: 0;
    }
  }
}
</style>
