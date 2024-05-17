<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';

import { CATALOG } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';

import { Banner } from '@components/Banner';

import { KUBEWARDEN_CHARTS } from '../types';
import { getLatestStableVersion } from '../plugins/kubewarden-class';
import { handleGrowl } from '../utils/handle-growl';
import { refreshCharts, findCompatibleDefaultsChart } from '../utils/chart';
import { fetchControllerApp } from '../modules/kubewardenController';

export default {
  components: { Banner },

  props: {
    mode: {
      type:    String,
      default: 'install'
    },
  },

  async fetch() {
    this.debouncedRefreshCharts = debounce((init = false) => {
      refreshCharts({
        store: this.$store, chartName: KUBEWARDEN_CHARTS.CONTROLLER, init
      });
    }, 500);

    if ( !this.defaultsChart ) {
      this.debouncedRefreshCharts(true);
    }

    if ( !this.controllerApp ) {
      await fetchControllerApp(this.$store);
    }
  },

  data() {
    return { debouncedRefreshCharts: null };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({
      charts: 'catalog/charts', t: 'i18n/t', controllerApp: 'kubewarden/controllerApp'
    }),

    controllerAppVersion() {
      return this.controllerApp?.spec?.chart?.metadata?.appVersion;
    },

    defaultsChart() {
      if ( this.kubewardenRepo ) {
        return this.$store.getters['catalog/chart']({
          repoName:  this.kubewardenRepo.repoName,
          repoType:  this.kubewardenRepo.repoType,
          chartName: KUBEWARDEN_CHARTS.DEFAULTS
        });
      }

      return null;
    },

    highestCompatibleDefaultsChart() {
      if ( this.controllerAppVersion && this.defaultsChart ) {
        const compatibleVersion = findCompatibleDefaultsChart(this.controllerApp, this.defaultsChart);

        return compatibleVersion;
      }

      return null;
    },

    kubewardenRepo() {
      return this.charts?.find(chart => chart.chartName === KUBEWARDEN_CHARTS.DEFAULTS);
    },

    bannerCopy() {
      return this.mode === 'upgrade' ? this.t('kubewarden.clusterAdmissionPolicy.kwDefaultsSettingsCompatibility', {}, true) : this.t('kubewarden.policyServer.noDefaultsInstalled.description', {}, true);
    },

    btnText() {
      return this.mode === 'upgrade' ? this.t('kubewarden.clusterAdmissionPolicy.defaultsUpdateBtn') : this.t('kubewarden.policyServer.noDefaultsInstalled.button');
    },

    isClosable() {
      return !this.mode === 'upgrade';
    },

    colorMode() {
      return this.mode === 'upgrade' ? 'warning' : 'info';
    }
  },

  methods: {
    async closeDefaultsBanner(retry = 0) {
      const res = await this.$store.dispatch('kubewarden/updateHideBannerDefaults', true);

      if ( retry === 0 && res?.type === 'error' && res?.status === 500 ) {
        await this.closeDefaultsBanner(retry + 1);
      }
    },

    async refreshCharts(retry = 0) {
      try {
        await this.$store.dispatch('catalog/refresh');
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
      }

      if ( !this.defaultsChart && retry === 0 ) {
        await this.$fetchType(CATALOG.CLUSTER_REPO);
        this.debouncedRefreshCharts();
      }
    },

    chartRoute() {
      if ( !this.defaultsChart ) {
        try {
          this.debouncedRefreshCharts();
        } catch (e) {
          handleGrowl({ error: e, store: this.$store });

          return;
        }
      }

      const {
        repoType, repoName, chartName, versions
      } = this.defaultsChart;
      const latestStableVersion = getLatestStableVersion(versions);

      if ( latestStableVersion ) {
        const query = {
          [REPO_TYPE]: repoType,
          [REPO]:      repoName,
          [CHART]:     chartName,
          [VERSION]:   this.highestCompatibleDefaultsChart?.version || latestStableVersion
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
};
</script>

<template>
  <Banner
    v-if="$fetchState.pending === false"
    data-testid="kw-defaults-banner"
    class="mb-20 mt-0"
    :color="colorMode"
    :closable="isClosable"
    @close="closeDefaultsBanner()"
  >
    <span v-clean-html="bannerCopy" />
    <button
      v-if="highestCompatibleDefaultsChart"
      data-testid="kw-defaults-banner-button"
      class="btn role-primary ml-10"
      @click.prevent="chartRoute"
    >
      {{ btnText }}
    </button>
  </Banner>
</template>
