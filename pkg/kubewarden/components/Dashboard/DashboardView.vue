<script>
import isEmpty from 'lodash/isEmpty';
import { mapGetters } from 'vuex';

import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { CATALOG, POD, UI_PLUGIN } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

import Loading from '@shell/components/Loading';

import { DASHBOARD_HEADERS } from '@kubewarden/config/table-headers';
import { KUBEWARDEN, KUBEWARDEN_APPS, KUBEWARDEN_CHARTS } from '@kubewarden/constants';
import { WG_POLICY_K8S } from '@kubewarden/types';

import { isPolicyServerResource } from '@kubewarden/modules/policyServer';

import Card from './Card';
import Masthead from './Masthead';
import Modes from './Modes';
import PolicyServerCard from './PolicyServerCard';
import Reports from './Reports';
import ReportsGauge from './ReportsGauge';

export default {
  components: {
    Card,
    Modes,
    Reports,
    Loading,
    Masthead,
    ReportsGauge,
    PolicyServerCard
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
      colorStops
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

    globalGuages() {
      return this.getPolicyGauges(this.globalPolicies);
    },

    namespacedPolicies() {
      return this.$store.getters['cluster/all'](KUBEWARDEN.ADMISSION_POLICY);
    },

    namespacedGuages() {
      return this.getPolicyGauges(this.namespacedPolicies);
    },

    namespacedResultsGauges() {
      return this.getPolicyResultGauges(this.admissionPolicyResults);
    },

    clusterResultsGauges() {
      return this.getPolicyResultGauges(this.clusterPolicyResults);
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
    }
  },

  methods: {
    getPolicyGauges(type) {
      if (!isEmpty(type)) {
        return type?.reduce((policy, neu) => {
          return {
            status: {
              running: policy?.status?.running + (neu?.status?.policyStatus === 'active' ? 1 : 0),
              stopped: policy?.status?.stopped + (neu?.status?.error ? 1 : 0),
              pending: policy?.status?.pending + (neu?.status?.policyStatus === 'pending' ? 1 : 0),
            },
            mode: {
              protect: policy?.mode?.protect + (neu?.spec?.mode === 'protect' ? 1 : 0),
              monitor: policy?.mode?.monitor + (neu?.spec?.mode === 'monitor' ? 1 : 0)
            },
            total: policy?.total + 1
          };
        }, {
          status: {
            running: 0,
            stopped: 0,
            pending: 0
          },
          mode:   {
            protect: 0,
            monitor: 0
          },
          total: 0
        });
      }

      return {
        status: {
          running: 0,
          stopped: 0,
          pending: 0
        },
        mode:   {
          protect: 0,
          monitor: 0
        },
        total: 0
      };
    },

    getPolicyResultGauges(type) {
      if (!isEmpty(type)) {
        return type?.reduce((res, neu) => {
          return {
            status: {
              success: res?.status?.success + (neu?.result === 'pass' ? 1 : 0),
              fail:    res?.status?.fail + (neu?.result === 'fail' ? 1 : 0),
              error:   res?.status?.error + (neu?.result === 'error' ? 1 : 0)
            },
            total: res?.total + 1
          };
        }, {
          status: {
            success: 0,
            fail:    0,
            error:   0
          },
          total: 0
        });
      }

      return {
        status: {
          success: 0,
          fail:    0,
          error:   0
        },
        total: 0
      };
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="dashboard">
    <Masthead :controller-app="controllerApp" />

    <div class="get-started">
      <div
        v-for="(card, index) in DASHBOARD_HEADERS"
        :key="index"
        class="card-container"
      >
        <Card v-if="card.isEnabled" :card="card">
          <template #count>
            <span v-if="index === 0" class="count">{{ namespacedPolicies.length || 0 }}</span>
            <span v-if="index === 1" class="count">{{ globalPolicies.length || 0 }}</span>
            <span v-if="index === 2" class="count">{{ allPolicyServers.length || 0 }}</span>
          </template>

          <template #content>
            <span v-if="index === 0">
              <Modes :gauges="namespacedGuages" :mode-link="card.modeLink" />
              <template v-if="showReports">
                <Reports :gauges="namespacedResultsGauges" :show-reporter-link="showReporterLink" />
                <ReportsGauge
                  data-testid="kw-dashboard-ap-gauge"
                  resource-name="Active"
                  :reports="namespacedResultsGauges"
                  :used-as-resource-name="true"
                />
              </template>
            </span>

            <span v-if="index === 1">
              <Modes :gauges="globalGuages" :mode-link="card.modeLink" />
              <template v-if="showReports">
                <Reports :gauges="clusterResultsGauges" :show-reporter-link="showReporterLink" />
                <ReportsGauge
                  data-testid="kw-dashboard-cap-gauge"
                  resource-name="Active"
                  :reports="clusterResultsGauges"
                />
              </template>
            </span>

            <span v-if="index === 2">
              <PolicyServerCard :policyServers="policyServersWithStatusAndModes" :card="card" />
            </span>
          </template>
        </Card>
      </div>
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

    .card-container {
      padding: 0;
      margin: 0;
    }
  }
}

:deep(.consumption-gauge) {
  h4, .numbers {
    font-size: 12px;
    margin-bottom: 0;
  }
}

.count {
  font-size: 36px;
  color: var(--text-color);
  margin-right: 1rem;
}

.modes, .events {
  display: flex;
  flex-direction: row;
  align-items: baseline;
}

.action {
  justify-content: center;
  width: 100%;
}
</style>
