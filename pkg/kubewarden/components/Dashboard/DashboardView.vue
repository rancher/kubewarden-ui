<script>
import { mapGetters } from 'vuex';
import semver from 'semver';
import isEmpty from 'lodash/isEmpty';
import { Banner } from '@components/Banner';

import { CATALOG, POD, UI_PLUGIN } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { allHash } from '@shell/utils/promise';

import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import Loading from '@shell/components/Loading';
import { newPolicyReportCompatible } from '../../modules/policyReporter';

import { DASHBOARD_HEADERS } from '../../config/table-headers';
import {
  KUBEWARDEN, KUBEWARDEN_APPS, KUBEWARDEN_CHARTS, KUBEWARDEN_LABELS, KUBEWARDEN_PRODUCT_NAME
} from '../../types';
import { handleGrowl } from '../../utils/handle-growl';

import DefaultsBanner from '../DefaultsBanner';
import Card from './Card';

export default {
  components: {
    Banner, Card, ConsumptionGauge, DefaultsBanner, Loading
  },

  async fetch() {
    const hash = {};
    const types = [
      KUBEWARDEN.ADMISSION_POLICY,
      KUBEWARDEN.CLUSTER_ADMISSION_POLICY,
      POD,
      CATALOG.APP,
      CATALOG.CLUSTER_REPO,
      UI_PLUGIN
    ];

    for ( const type of types ) {
      if ( this.$store.getters['cluster/canList'](type) ) {
        hash[type] = this.$store.dispatch('cluster/findAll', { type });
      }
    }

    await allHash(hash);

    if ( isEmpty(this.charts) ) {
      await this.$store.dispatch('catalog/load');
    }
  },

  data() {
    const colorStops = {
      25: '--error', 50: '--warning', 70: '--info'
    };

    return {
      DASHBOARD_HEADERS,
      colorStops
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ charts: 'catalog/charts' }),

    allApps() {
      return this.$store.getters['cluster/all'](CATALOG.APP);
    },

    allPods() {
      return this.$store.getters['cluster/all'](POD);
    },

    controllerApp() {
      if ( this.allApps ) {
        return this.allApps?.find((a) => {
          return (
            a.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_CONTROLLER ||
            a.spec?.chart?.metadata?.name === KUBEWARDEN_CHARTS.CONTROLLER
          );
        });
      }

      return null;
    },

    controllerChart() {
      if ( !isEmpty(this.charts) ) {
        return this.charts.find(chart => chart?.chartName === KUBEWARDEN_CHARTS.CONTROLLER);
      }

      return null;
    },

    defaultsApp() {
      if ( this.allApps ) {
        return this.allApps?.find((a) => {
          return a.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_DEFAULTS;
        });
      }

      return false;
    },

    policyServerPods() {
      if ( this.$store.getters['cluster/canList'](POD) ) {
        const pods = this.allPods?.filter(pod => pod?.metadata?.labels?.[KUBEWARDEN_LABELS.POLICY_SERVER]);

        if ( !isEmpty(pods) ) {
          return Object.values(pods).flat();
        }

        return null;
      }

      return null;
    },

    /** Counts the current policy server pods - returns the status and total count */
    policyServerCounts() {
      const pods = this.policyServerPods || [];

      if ( !isEmpty(pods) ) {
        return pods?.reduce((ps, neu) => {
          const neuContainerStatues = neu?.status?.containerStatuses;
          let terminated = false;

          // If the container state is terminated, remove it from the available counts
          if ( !isEmpty(neuContainerStatues) ) {
            const filtered = neuContainerStatues.filter(status => status?.state['terminated']);

            if ( !isEmpty(filtered) ) {
              terminated = true;
            }
          }

          return {
            status: {
              running:       ps?.status?.running + ( neu?.metadata?.state?.name === 'running' && !terminated ? 1 : 0 ),
              stopped:       ps?.status?.stopped + ( neu?.metadata?.state?.error ? 1 : 0 ),
              pending:       ps?.status?.transitioning + ( neu?.metadata?.state?.transitioning ? 1 : 0 )
            },
            total: terminated ? ps?.total || 0 : ps?.total + 1
          };
        }, {
          status: {
            running: 0, stopped: 0, pending: 0
          },
          total: 0
        });
      }

      return {
        status: {
          running: 0, stopped: 0, pending: 0
        },
        total: 0
      };
    },

    globalPolicies() {
      return this.$store.getters['cluster/all'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY);
    },

    globalGuages() {
      return this.getPolicyGauges(this.globalPolicies);
    },

    hideBannerDefaults() {
      return this.$store.getters['kubewarden/hideBannerDefaults'] || !!this.defaultsApp;
    },

    namespacedPolicies() {
      return this.$store.getters['cluster/all'](KUBEWARDEN.ADMISSION_POLICY);
    },

    namespacedGuages() {
      return this.getPolicyGauges(this.namespacedPolicies);
    },

    appVersion() {
      return this.controllerApp?.spec?.chart?.metadata?.appVersion;
    },

    upgradeAvailable() {
      if ( this.controllerApp && this.controllerChart ) {
        const installedAppVersion = this.controllerApp.spec?.chart?.metadata?.appVersion;
        const installedChartVersion = this.controllerApp.spec?.chart?.metadata?.version;
        const chartVersions = this.controllerChart.versions;

        if ( installedAppVersion ) {
          const uniqueSortedVersions = Array.from(new Set(chartVersions.map(v => v.appVersion)))
            .filter(v => this.showPreRelease ? v : !semver.prerelease(v))
            .sort(semver.compare);

          let highestVersion = null;

          for ( const version of uniqueSortedVersions ) {
            const upgradeAvailable = this.getValidUpgrade(installedAppVersion, version, highestVersion);

            if ( upgradeAvailable ) {
              highestVersion = upgradeAvailable;
            }
          }

          if ( !highestVersion ) {
          // Find the highest chart version for the current appVersion
            const chartsWithCurrentAppVersion = chartVersions.filter(v => v.appVersion === installedAppVersion);
            const highestChartForCurrentVersion = chartsWithCurrentAppVersion
              .sort((a, b) => semver.rcompare(a.version, b.version))[0];

            if ( highestChartForCurrentVersion && semver.gt(highestChartForCurrentVersion.version, installedChartVersion) ) {
              highestVersion = installedAppVersion;
            }
          }

          if ( highestVersion ) {
          // Find the chart with the highest chart version for the highest appVersion
            const matchingCharts = chartVersions
              .filter(v => v.appVersion === highestVersion)
              .sort((a, b) => semver.rcompare(a.version, b.version));

            return matchingCharts.length > 0 ? matchingCharts[0] : null;
          }
        }
      }

      return null;
    },

    showPreRelease() {
      return this.$store.getters['prefs/get'](SHOW_PRE_RELEASE);
    },

    kubewardenExtension() {
      const extensionsInstalled = this.$store.getters['uiplugins/plugins'] || [];

      return extensionsInstalled.find(ext => ext.id.includes(KUBEWARDEN_PRODUCT_NAME));
    },

    policyReportsCompatible() {
      const controllerAppVersion = this.controllerApp?.spec?.chart?.metadata?.appVersion;
      const uiPluginVersion = this.kubewardenExtension?.version;

      if ( controllerAppVersion && uiPluginVersion) {
        return newPolicyReportCompatible(controllerAppVersion, uiPluginVersion);
      }

      return {
        oldSPolicyReports: true,
        newPolicyReports:  true
      };
    }
  },

  methods: {
    getPolicyGauges(type) {
      if ( !isEmpty(type) ) {
        return type?.reduce((policy, neu) => {
          return {
            status: {
              running: policy?.status?.running + ( neu?.status?.policyStatus === 'active' ? 1 : 0 ),
              stopped: policy?.status?.stopped + ( neu?.status?.error ? 1 : 0 ),
              pending: policy?.status?.pending + ( neu?.status?.policyStatus === 'pending' ? 1 : 0 ),
            },
            mode: {
              protect: policy?.mode?.protect + ( neu?.spec?.mode === 'protect' ? 1 : 0 ),
              monitor: policy?.mode?.monitor + ( neu?.spec?.mode === 'monitor' ? 1 : 0 )
            },
            total: policy?.total + 1
          };
        }, {
          status: {
            running: 0, stopped: 0, pending: 0
          },
          mode:   { protect: 0, monitor: 0 },
          total:  0
        });
      }

      return {
        status: {
          running: 0, stopped: 0, pending: 0
        },
        mode:   { protect: 0, monitor: 0 },
        total:  0
      };
    },

    getValidUpgrade(currentVersion, upgradeVersion, highestVersion) {
      const currentMajor = semver.major(currentVersion);
      const currentMinor = semver.minor(currentVersion);

      const upgradeMajor = semver.major(upgradeVersion);
      const upgradeMinor = semver.minor(upgradeVersion);
      const upgradePatch = semver.patch(upgradeVersion);

      let highestMajor, highestMinor, highestPatch;

      if ( highestVersion ) {
        highestMajor = semver.major(highestVersion);
        highestMinor = semver.minor(highestVersion);
        highestPatch = semver.patch(highestVersion);
      } else {
        // Default to current version's major and minor, and -1 for patch if there's no highest version yet
        highestMajor = currentMajor;
        highestMinor = currentMinor;
        highestPatch = -1;
      }

      // Skip versions that are not upgrades
      if ( semver.lte(upgradeVersion, currentVersion) ) {
        return null;
      }

      // Determine if the upgrade is valid based on the major and minor versions
      const isValidUpgrade = ( upgradeMajor === currentMajor && upgradeMinor === currentMinor + 1 ) ||
                             ( upgradeMajor === currentMajor + 1 && upgradeMinor === 0 );

      if ( isValidUpgrade ) {
        // If it's a valid upgrade, check if it's higher than the current highest version
        if ( !highestVersion || semver.gt(upgradeVersion, highestVersion) ) {
          return upgradeVersion;
        }
      }

      // Check for a higher patch version within the same minor version
      if ( upgradeMajor === highestMajor && upgradeMinor === highestMinor && upgradePatch > highestPatch ) {
        return upgradeVersion;
      }

      return null;
    },

    controllerChartRoute() {
      if ( this.upgradeAvailable ) {
        const {
          repoType, repoName, name, version
        } = this.upgradeAvailable;

        if ( version ) {
          const query = {
            [REPO_TYPE]: repoType,
            [REPO]:      repoName,
            [CHART]:     name,
            [VERSION]:   version
          };

          this.$router.push({
            name:   'c-cluster-apps-charts-install',
            params: { cluster: this.currentCluster?.id || '_' },
            query,
          });
        } else {
          const error = {
            _statusText: this.t('kubewarden.dashboard.appInstall.versionError.title'),
            message:     this.t('kubewarden.dashboard.appInstall.versionError.message')
          };

          handleGrowl({ error, store: this.$store });
        }
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="dashboard">
    <Banner
      v-if="controllerApp && kubewardenExtension && !policyReportsCompatible.newPolicyReports"
      :label="t('kubewarden.dashboard.policyReports.newPolicyReportsIncompatible', { version: kubewardenExtension?.version }, true)"
      color="warning"
      class="mb-40"
      data-testid="kw-dashboard-pr-incompatible-banner-new-policy-structure"
    />
    <Banner
      v-else-if="controllerApp && kubewardenExtension && !policyReportsCompatible.oldSPolicyReports"
      :label="t('kubewarden.dashboard.policyReports.oldPolicyReportsIncompatible', { version: controllerApp.spec?.chart?.metadata?.appVersion }, true)"
      color="warning"
      class="mb-40"
      data-testid="kw-dashboard-pr-incompatible-banner-old-policy-structure"
    />
    <div class="head">
      <div class="head-title">
        <h1 data-testid="kw-dashboard-title">
          {{ t('kubewarden.dashboard.intro') }}
        </h1>

        <div v-if="appVersion" class="head-version-container">
          <div class="head-version bg-primary mr-10">
            {{ t('kubewarden.dashboard.upgrade.appVersion') }}: {{ appVersion }}
          </div>
          <div
            v-if="upgradeAvailable"
            data-testid="kw-app-upgrade-button"
            class="head-upgrade badge-state bg-warning hand"
            :disabled="!controllerChart"
            @click.prevent="controllerChartRoute"
          >
            <i class="icon icon-upload" />
            <span>{{ t('kubewarden.dashboard.upgrade.appUpgrade') }}: {{ upgradeAvailable.appVersion }} &nbsp;-&nbsp;</span>
            <span>{{ t('kubewarden.dashboard.upgrade.chart') }}: {{ upgradeAvailable.version }}</span>
          </div>
        </div>
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
                :capacity="policyServerCounts.total"
                :used-as-resource-name="true"
                :used="policyServerCounts.status.running"
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
      flex-direction: column;
      gap: 5px;

      h1 {
        margin: 0;
      }
    }

    &-version-container {
      display: flex;
      flex-direction: row;
    }

    &-upgrade {
      display: flex;
    }

    &-version, &-upgrade {
      border-radius: var(--border-radius);
      padding: 4px 8px;
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
