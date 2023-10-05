<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { CATALOG, POD, WORKLOAD_TYPES } from '@shell/config/types';
import { KUBERNETES, CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { allHash } from '@shell/utils/promise';
import ResourceManager from '@shell/mixins/resource-manager';

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

  mixins: [ResourceManager],

  async fetch() {
    const inStore = this.currentProduct.inStore;
    const hash = {};
    const types = [
      KUBEWARDEN.ADMISSION_POLICY,
      KUBEWARDEN.CLUSTER_ADMISSION_POLICY
    ];

    for ( const type of types ) {
      if ( this.$store.getters[`${ inStore }/canList`](type) ) {
        hash[type] = this.$store.dispatch(`${ inStore }/findAll`, { type });
      }
    }

    await allHash(hash);

    this.secondaryResourceData = this.secondaryResourceDataConfig();
    this.resourceManagerFetchSecondaryResources(this.secondaryResourceData);
  },

  data() {
    const colorStops = {
      25: '--error', 50: '--warning', 70: '--info'
    };

    return {
      DASHBOARD_HEADERS,
      colorStops,

      apps:                  null,
      controller:            null,
      psPods:                [],
      secondaryResourceData: this.secondaryResourceDataConfig(),
    };
  },

  computed: {
    ...mapGetters(['currentProduct']),

    defaultsApp() {
      if ( this.apps ) {
        return this.apps?.find((a) => {
          return a.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_DEFAULTS;
        });
      }

      return true;
    },

    /** Counts the current policy server pods - returns the status and total count */
    policyServers() {
      const pods = this.psPods || [];

      return pods.reduce((ps, neu) => {
        const neuContainerStatues = neu?.status?.containerStatuses;
        let terminated = false;

        // If the container state is terminated, remove it from the available counts
        if ( !isEmpty(neuContainerStatues) ) {
          const filtered = neuContainerStatues.filter(status => status.state['terminated']);

          if ( !isEmpty(filtered) ) {
            terminated = true;
          }
        }

        return {
          status: {
            running:       ps?.status.running + ( neu.metadata.state.name === 'running' && !terminated ? 1 : 0 ),
            stopped:       ps?.status.stopped + ( neu.metadata.state.error ? 1 : 0 ),
            pending:       ps?.status.transitioning + ( neu.metadata.state.transitioning ? 1 : 0 )
          },
          total: terminated ? ps?.total || 0 : ps?.total + 1
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

    hideBannerDefaults() {
      return this.$store.getters['kubewarden/hideBannerDefaults'] || !!this.defaultsApp;
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
    secondaryResourceDataConfig() {
      return {
        namespace: this.controller?.metadata?.namespace,
        data:      {
          [WORKLOAD_TYPES.DEPLOYMENT]: {
            applyTo: [
              { var: 'namespacedDeployments' },
              {
                var:         'controller',
                parsingFunc: (data) => {
                  return data.find(deploy => deploy?.metadata?.labels?.[KUBERNETES.MANAGED_NAME] === KUBEWARDEN_CHARTS.CONTROLLER);
                }
              }
            ]
          },
          [POD]: {
            applyTo: [
              { var: 'namespacedPods' },
              {
                var:         'psPods',
                parsingFunc: (data) => {
                  return data.filter(pod => pod?.metadata?.labels['kubewarden/policy-server']);
                }
              }
            ]
          },
          [CATALOG.APP]: { applyTo: [{ var: 'apps' }] }
        }
      };
    },

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
        <h1 data-testid="kw-dashboard-title">
          {{ t('kubewarden.dashboard.intro') }}
        </h1>
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

    <DefaultsBanner v-if="!hideBannerDefaults" />

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
                data-testid="kw-dashboard-ps-gauge"
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
                data-testid="kw-dashboard-ap-gauge"
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
                data-testid="kw-dashboard-cap-gauge"
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
