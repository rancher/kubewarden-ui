<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { CATALOG, POD, UI_PLUGIN } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { allHash } from '@shell/utils/promise';

import Loading from '@shell/components/Loading';

import { DASHBOARD_HEADERS } from '@kubewarden/config/table-headers';
import { KUBEWARDEN, KUBEWARDEN_APPS, KUBEWARDEN_CHARTS, WG_POLICY_K8S } from '@kubewarden/types';

import { isPolicyServerResource } from '@kubewarden/modules/policyServer';

import Masthead from './Masthead';
import PolicyServerCard from './PolicyServerCard';
import PoliciesCard from './PoliciesCard';
import { RcItemCard } from '@components/RcItemCard';
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';

export default {
  components: {
    Loading,
    Masthead,
    RcItemCard,
    PolicyServerCard,
    PoliciesCard,
    VerticalGap
  },

  async fetch() {
    const hash = {};
    const types = [
      WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE,
      WG_POLICY_K8S.POLICY_REPORT.TYPE,
      KUBEWARDEN.ADMISSION_POLICY,
      KUBEWARDEN.CLUSTER_ADMISSION_POLICY,
      KUBEWARDEN.POLICY_SERVER,
      POD,
      CATALOG.APP,
      CATALOG.CLUSTER_REPO,
      UI_PLUGIN
    ];

    for (const type of types) {
      if (this.$store.getters['cluster/canList'](type)) {
        hash[type] = this.$store.dispatch('cluster/findAll', { type });
      }
    }

    await allHash(hash);

    if (isEmpty(this.charts)) {
      await this.$store.dispatch('catalog/load');
    }

    if (this.controllerApp) {
      await this.controllerApp.fetchValues(true);
    }
  },

  data() {
    const colorStops = {
      25: '--error',
      50: '--warning',
      70: '--success'
    };

    return {
      DASHBOARD_HEADERS,
      colorStops,
    };
  },

  computed: {
    ...mapGetters({ charts: 'catalog/charts' }),

    allApps() {
      return this.$store.getters['cluster/all'](CATALOG.APP);
    },

    allPods() {
      return this.$store.getters['cluster/all'](POD);
    },

    allPolicyServers() {
      return this.$store.getters['cluster/all'](KUBEWARDEN.POLICY_SERVER);
    },

    controllerApp() {
      if (this.allApps) {
        return this.allApps?.find((a) => {
          return (
            a.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_CONTROLLER ||
            a.spec?.chart?.metadata?.name === KUBEWARDEN_CHARTS.CONTROLLER
          );
        });
      }

      return null;
    },

    policyServerPods() {
      if (this.$store.getters['cluster/canList'](POD)) {
        const policyServerNames = this.allPolicyServers
          ?.map((ps) => ps.metadata?.name)
          .filter((name) => !!name);

        const pods = this.allPods?.filter((pod) => {
          const labels = pod?.metadata?.labels;

          return policyServerNames?.some((name) => isPolicyServerResource(labels, name));
        });

        if (!isEmpty(pods)) {
          return pods;
        }

        return null;
      }

      return null;
    },

    policyServersWithStatusAndModes() {
      return this.allPolicyServers.map((server) => {
        const name = server.metadata?.name;

        const podsForThisServer = (this.policyServerPods || []).filter((pod) => {
          const labels = pod?.metadata?.labels;

          return isPolicyServerResource(labels, name);
        });

        let runningCount = 0;
        let pendingCount = 0;
        let errorCount   = 0;

        podsForThisServer.forEach((pod) => {
          if (pod?.metadata?.state?.name === 'running') {
            runningCount++;
          } else if (pod?.metadata?.state?.transitioning) {
            pendingCount++;
          } else if (pod?.metadata?.state?.error) {
            errorCount++;
          }
        });

        const totalPods   = podsForThisServer.length;
        let overallStatus = 'stopped'; // default

        if (runningCount === totalPods && totalPods > 0) {
          overallStatus = 'running';
        } else if (pendingCount > 0) {
          overallStatus = 'pending';
        } else if (errorCount > 0) {
          overallStatus = 'error';
        }

        // Counts how many policies (namespaced + cluster) reference this server
        const allPolicies = [...this.namespacedPolicies, ...this.globalPolicies];
        const polsForThisServer = allPolicies.filter((p) => p.spec?.policyServer === name);

        let monitorCount = 0;
        let protectCount = 0;

        polsForThisServer.forEach((p) => {
          if (p.spec?.mode === 'monitor') {
            monitorCount++;
          } else if (p.spec?.mode === 'protect') {
            protectCount++;
          }
        });

        return {
          ...server,
          _status:       overallStatus,
          _totalPods:    totalPods,
          _runningCount: runningCount,
          _pendingCount: pendingCount,
          _errorCount:   errorCount,
          _monitorCount: monitorCount,
          _protectCount: protectCount
        };
      });
    },

    globalPolicies() {
      return this.$store.getters['cluster/all'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY);
    },

    namespacedPolicies() {
      return this.$store.getters['cluster/all'](KUBEWARDEN.ADMISSION_POLICY);
    },

    namespacesStats() {
      return this.mapRow(this.admissionPolicyResults);
    },
    clusterStats() {
      return this.mapRow(this.clusterPolicyResults);
    },

    policyReports() {
      return {
        [WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE]: this.$store.getters['cluster/all'](WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE),
        [WG_POLICY_K8S.POLICY_REPORT.TYPE]:         this.$store.getters['cluster/all'](WG_POLICY_K8S.POLICY_REPORT.TYPE)
      };
    },

    admissionPolicyResults() {
      if (!isEmpty(this.policyReports[WG_POLICY_K8S.POLICY_REPORT.TYPE])) {
        let out = [];

        this.policyReports[WG_POLICY_K8S.POLICY_REPORT.TYPE].filter((report) => {
          const results = report?.results?.filter((result) => result?.policy.includes('namespaced-'));

          if (!isEmpty(results)) {
            out = [...out, ...results];
          }
        });

        return out;
      }

      return null;
    },

    clusterPolicyResults() {
      if (!isEmpty(this.policyReports)) {
        const pr = this.policyReports[WG_POLICY_K8S.POLICY_REPORT.TYPE];
        const cpr = this.policyReports[WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE];
        let out = [];

        if (!isEmpty(cpr)) {
          const results = cpr.flatMap((report) => report?.results);

          out = [...out, ...results];
        }

        if (!isEmpty(pr)) {
          const results = pr.flatMap((report) => {
            return report?.results?.filter((result) => !result?.policy.includes('namespaced-'));
          });

          out = [...out, ...results];
        }

        return out;
      }

      return null;
    },

    showReports() {
      if (this.controllerApp) {
        const auditScanner = this.controllerApp.values?.auditScanner;

        // The enable property will not exist if the auditScanner is enabled.
        // If the enable property exists and is set to false, the auditScanner is disabled.
        return auditScanner?.enable !== false;
      }

      return false;
    },

    showReporterLink() {
      if (this.controllerApp) {
        const auditScanner = this.controllerApp.values?.auditScanner;

        return !!auditScanner?.policyReporter;
      }

      return false;
    },
  },

  methods: {
    mapRow(policies) {
      if (!isEmpty(policies)) {
        const total = policies.length;
        const getPercentage = (count) => count ? Math.round((count / total) * 100) : 0;

        const stats = policies?.reduce((acc, item) => {
          const isActive = item?.result === 'pass';
          const isError = item?.result === 'fail';

          acc.rows[0].count = acc.rows[0].count + isActive;
          acc.rows[1].count = acc.rows[1].count + isError;
          acc.rows[0].percent = getPercentage(acc.rows[0].count);
          acc.rows[1].percent = getPercentage(acc.rows[1].count);
          acc.mode.protect = acc.mode.protect + (item?.spec?.mode === 'protect' ? 1 : 0);
          acc.mode.monitor = acc.mode.monitor + (item?.spec?.mode === 'monitor' ? 1 : 0);

          return acc;
        }, {
          rows: [{
            count:   0,
            percent: 0,
          },
          {
            count:   0,
            percent: 0,
          }],
          mode: {
            protect: 0,
            monitor: 0
          },
          total
        });

        return {
          rows: [{
            ...stats.rows[0],
            label:   'kubewarden.dashboard.cards.generic.success',
            color:   'success'
          }, {
            ...stats.rows[1],
            label:   'kubewarden.dashboard.cards.generic.error',
            color:   'error'
          }],
          mode: stats.mode
        };
      }
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="dashboard">
    <Masthead :controller-app="controllerApp" />

    <!-- TEMPORARY CHECK -->
    <div class="get-started">
      <template
        v-for="(card, index) in DASHBOARD_HEADERS"
        :key="index"
      >
        <RcItemCard
          :id="index"
          variant="small"
          :header="{
            title: { text: t(card.title) },
            statuses: [],
          }"
          :content="{}"
        >
          <template #item-card-actions></template>
          <template #item-card-content>
            <!-- Namespace card -->
            <template v-if="index === 0">
              <p>{{ t('kubewarden.dashboard.cards.namespaced.description') }}</p>
              <VerticalGap />
              <PoliciesCard
                :stats="namespacesStats"
                :show-reports="showReports"
                :empty-label="t('kubewarden.dashboard.cards.namespaced.empty')"
                :protect-link="card.modeLink({ q: 'protect' })"
                :monitor-link="card.modeLink({ q: 'monitor' })"
                data-test-id="kw-dashboard-ap-gauge"
              />
            </template>

            <!-- Cluster card -->
            <template v-if="index === 1">
              <VerticalGap />
              <PoliciesCard
                :stats="clusterStats"
                :show-reports="showReports"
                :empty-label="t('kubewarden.dashboard.cards.cluster.empty')"
                :protect-link="card.modeLink({ q: 'protect' })"
                :monitor-link="card.modeLink({ q: 'monitor' })"
                data-test-id="kw-dashboard-cap-gauge"
              />
            </template>

            <!-- Policy Servers list card -->
            <template v-else-if="index === 2">
              <span v-if="index === 2">
                <VerticalGap />
                <PolicyServerCard :policyServers="policyServersWithStatusAndModes" :card="card" />
              </span>
            </template>
          </template>
        </RcItemCard>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;

  .get-started {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
    grid-gap: 20px;
  }
}
</style>
