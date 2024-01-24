<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';

import { CATALOG } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';

import { Banner } from '@components/Banner';

import { KUBEWARDEN_CHARTS } from '../types';
import { getLatestStableVersion } from '../plugins/kubewarden-class';
import { handleGrowl } from '../utils/handle-growl';
import { refreshCharts } from '../utils/chart';

export default {
  components: { Banner },

  fetch() {
    this.debouncedRefreshCharts = debounce((init = false) => {
      refreshCharts({
        store: this.$store, chartName: KUBEWARDEN_CHARTS.CONTROLLER, init
      });
    }, 500);

    if ( !this.defaultsChart ) {
      this.debouncedRefreshCharts(true);
    }
  },

  data() {
    return { debouncedRefreshCharts: null };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ charts: 'catalog/charts', t: 'i18n/t' }),

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

    kubewardenRepo() {
      return this.charts?.find(chart => chart.chartName === KUBEWARDEN_CHARTS.DEFAULTS);
    },
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

    async chartRoute() {
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
          [VERSION]:   latestStableVersion.version
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
    data-testid="kw-defaults-banner"
    class="mb-20 mt-0"
    color="info"
    :closable="true"
    @close="closeDefaultsBanner()"
  >
    <span v-clean-html="t('kubewarden.policyServer.noDefaultsInstalled.description', {}, true)" />
    <button
      v-if="defaultsChart"
      data-testid="kw-defaults-banner-button"
      class="btn role-primary ml-10"
      @click.prevent="chartRoute"
    >
      {{ t("kubewarden.policyServer.noDefaultsInstalled.button") }}
    </button>
  </Banner>
</template>
