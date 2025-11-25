<script>
import isEmpty from 'lodash/isEmpty';
import { mapGetters } from 'vuex';

import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { CHART, REPO, REPO_TYPE, VERSION } from '@shell/config/query-params';
import { CATALOG } from '@shell/config/types';

import { Banner } from '@components/Banner';

import { KUBEWARDEN_APPS, KUBEWARDEN_CHARTS, KUBEWARDEN_PRODUCT_NAME } from '@kubewarden/constants';

import { newPolicyReportCompatible } from '@kubewarden/modules/policyReporter';
import { appVersionSatisfiesConstraint, checkUpgradeAvailable } from '@kubewarden/utils/chart';
import { handleGrowl } from '@kubewarden/utils/handle-growl';

import DefaultsBanner from '@kubewarden/components/DefaultsBanner';

export default {
  props: {
    controllerApp: {
      type:    Object,
      default: null
    }
  },

  components: {
    Banner,
    DefaultsBanner
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ charts: 'catalog/charts' }),

    appVersionSatisfies() {
      const satisfies = appVersionSatisfiesConstraint(this.$store, this.controllerAppVersion, this.defaultsAppVersion, '<=');

      return satisfies || false;
    },

    allApps() {
      return this.$store.getters['cluster/all'](CATALOG.APP);
    },

    controllerAppVersion() {
      return this.controllerApp?.spec?.chart?.metadata?.appVersion;
    },

    controllerChart() {
      if (!isEmpty(this.charts)) {
        return this.charts.find((chart) => chart?.chartName === KUBEWARDEN_CHARTS.CONTROLLER);
      }

      return null;
    },

    controllerUpgradeAvailable() {
      if (this.controllerApp && this.controllerChart) {
        return checkUpgradeAvailable(this.$store, this.controllerApp, this.controllerChart);
      }

      return null;
    },

    defaultsApp() {
      if (this.allApps) {
        return this.allApps?.find((a) => {
          return a.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_DEFAULTS;
        });
      }

      return false;
    },

    defaultsAppVersion() {
      return this.defaultsApp?.spec?.chart?.metadata?.appVersion;
    },

    defaultsChart() {
      if (!isEmpty(this.charts)) {
        return this.charts.find((chart) => chart?.chartName === KUBEWARDEN_CHARTS.DEFAULTS);
      }

      return null;
    },

    defaultsUpgradeAvailable() {
      if (!this.appVersionSatisfies) {
        return checkUpgradeAvailable(this.$store, this.defaultsApp, this.defaultsChart);
      }

      return null;
    },

    hideBannerDefaults() {
      return this.$store.getters['kubewarden/hideBannerDefaults'] || !!this.defaultsApp;
    },

    kubewardenExtension() {
      const extensionsInstalled = this.$store.getters['uiplugins/plugins'] || [];

      return extensionsInstalled.find((ext) => ext.id.includes(KUBEWARDEN_PRODUCT_NAME));
    },

    policyReportsCompatible() {
      const uiPluginVersion = this.kubewardenExtension?.version;

      if (this.controllerAppVersion && uiPluginVersion) {
        return newPolicyReportCompatible(this.controllerAppVersion, uiPluginVersion);
      }

      return {
        oldPolicyReports: true,
        newPolicyReports:  true
      };
    }
  },

  methods: {
    getChartRoute(upgradeAvailable) {
      if (upgradeAvailable) {
        const {
          repoType, repoName, name, version
        } = upgradeAvailable;

        if (version) {
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

          handleGrowl({
            error,
            store: this.$store
          });
        }
      }
    }
  }
};
</script>

<template>
  <div>
    <Banner
      v-if="controllerApp && kubewardenExtension && !policyReportsCompatible.newPolicyReports"
      :label="t('kubewarden.dashboard.policyReports.newPolicyReportsIncompatible', { version: kubewardenExtension?.version }, true)"
      color="warning"
      class="mb-40"
      data-testid="kw-dashboard-pr-incompatible-banner-new-policy-structure"
    />

    <Banner
      v-else-if="controllerApp && kubewardenExtension && !policyReportsCompatible.oldPolicyReports"
      :label="t('kubewarden.dashboard.policyReports.oldPolicyReportsIncompatible', { version: controllerAppVersion }, true)"
      color="warning"
      class="mb-40"
      data-testid="kw-dashboard-pr-incompatible-banner-old-policy-structure"
    />

    <div v-if="controllerAppVersion && defaultsApp && !appVersionSatisfies">
      <Banner
        :label="t('kubewarden.dashboard.upgrade.appVersionUnsatisfied', { controllerAppVersion, defaultsAppVersion }, true)"
        color="warning"
        class="mb-20"
        data-testid="kw-dashboard-upgrade-unsatisfied-banner"
      />
    </div>

    <div class="head">
      <div class="head-title">
        <h1 data-testid="kw-dashboard-title">
          {{ t('kubewarden.dashboard.intro') }}
        </h1>

        <div v-if="controllerAppVersion" class="head-version-container">
          <div class="head-version bg-primary mr-10">
            {{ t('kubewarden.dashboard.upgrade.appVersion') }}: {{ controllerAppVersion }}
          </div>
          <!-- Controller upgrade -->
          <div
            v-if="controllerUpgradeAvailable && appVersionSatisfies"
            data-testid="kw-app-controller-upgrade-button"
            class="head-upgrade badge-state bg-warning hand mr-10"
            :disabled="!controllerChart"
            @click.prevent="getChartRoute(controllerUpgradeAvailable)"
          >
            <i class="icon icon-upload" />
            <span>{{ t('kubewarden.dashboard.upgrade.appUpgrade') }}: {{ controllerUpgradeAvailable.appVersion }}</span>
            <span class="p-0">-</span>
            <span>{{ t('kubewarden.dashboard.upgrade.controllerChart') }}: {{ controllerUpgradeAvailable.version }}</span>
          </div>
          <!-- Defaults upgrade -->
          <div
            v-if="defaultsUpgradeAvailable"
            data-testid="kw-app-defaults-upgrade-button"
            class="head-upgrade badge-state bg-warning hand"
            :disabled="!defaultsChart"
            @click.prevent="getChartRoute(defaultsUpgradeAvailable)"
          >
            <i class="icon icon-upload" />
            <span>{{ t('kubewarden.dashboard.upgrade.appUpgrade') }}: {{ defaultsUpgradeAvailable.appVersion }}</span>
            <span class="p-0">-</span>
            <span>{{ t('kubewarden.dashboard.upgrade.defaultsChart') }}: {{ defaultsUpgradeAvailable.version }}</span>
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
  </div>
</template>

<style lang="scss" scoped>
.head {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-content: center;
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
    align-items: center;
  }

  &-upgrade {
    display: flex;
    align-items: center;
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
</style>
