<script>
import { mapGetters } from 'vuex';

import { CATALOG } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import ResourceFetch from '@shell/mixins/resource-fetch';

import { Banner } from '@components/Banner';

import { KUBEWARDEN_CHARTS } from '../types';
import { getLatestStableVersion } from '../plugins/kubewarden-class';

export default {
  components: { Banner },

  mixins: [ResourceFetch],

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ allRepos: 'catalog/repos' }),

    defaultsChart() {
      return this.$store.getters['catalog/chart']({ chartName: KUBEWARDEN_CHARTS.DEFAULTS });
    },
  },

  methods: {
    async closeDefaultsBanner(retry = 0) {
      const res = await this.$store.dispatch('kubewarden/updateHideDefaultsBanner', true);

      if ( retry === 0 && res?.type === 'error' && res?.status === 500 ) {
        await this.closeDefaultsBanner(retry + 1);
      }
    },

    async refreshCharts(retry = 0) {
      try {
        await this.$store.dispatch('catalog/load', { force: true, reset: true });
      } catch (e) {
        this.handleGrowlError(e);
      }

      if ( !this.defaultsChart && retry === 0 ) {
        await this.$fetchType(CATALOG.CLUSTER_REPO);
        await this.refreshCharts(retry + 1);
      }
    },

    async chartRoute() {
      if ( !this.defaultsChart ) {
        try {
          await this.refreshCharts();
        } catch (e) {
          this.handleGrowlError(e);

          return;
        }
      }

      const {
        repoType, repoName, chartName, versions
      } = this.defaultsChart;
      const latestStableVersion = getLatestStableVersion(versions);

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
    },

    handleGrowlError(e) {
      const error = e?.data || e;

      this.$store.dispatch('growl/error', {
        title:   error._statusText,
        message: error.message,
        timeout: 5000,
      }, { root: true });
    }
  }
};
</script>

<template>
  <Banner
    class="mb-20 mt-0"
    color="info"
    :closable="true"
    @close="closeDefaultsBanner()"
  >
    <span v-html="t('kubewarden.policyServer.noDefaultsInstalled.description', {}, true)" />
    <button
      class="btn role-primary ml-10"
      @click.prevent="chartRoute"
    >
      {{ t("kubewarden.policyServer.noDefaultsInstalled.button") }}
    </button>
  </Banner>
</template>
