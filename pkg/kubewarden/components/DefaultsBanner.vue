<script>
import { mapGetters } from 'vuex';

import { CATALOG } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import ResourceFetch from '@shell/mixins/resource-fetch';

import { Banner } from '@components/Banner';

import { KUBEWARDEN_CHARTS } from '../types';
import { getLatestStableVersion } from '../plugins/kubewarden-class';
import { handleGrowlError } from '../utils/handle-growl';

export default {
  components: { Banner },

  mixins: [ResourceFetch],

  computed: {
    ...mapGetters(['currentCluster']),

    defaultsChart() {
      return this.$store.getters['catalog/chart']({ chartName: KUBEWARDEN_CHARTS.DEFAULTS });
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
        await this.$store.dispatch('catalog/load', { force: true, reset: true });
      } catch (e) {
        handleGrowlError({ error: e, store: this.$store });
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
          handleGrowlError({ error: e, store: this.$store });

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

        handleGrowlError({ error, store: this.$store });
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
      data-testid="kw-defaults-banner-button"
      class="btn role-primary ml-10"
      @click.prevent="chartRoute"
    >
      {{ t("kubewarden.policyServer.noDefaultsInstalled.button") }}
    </button>
  </Banner>
</template>
