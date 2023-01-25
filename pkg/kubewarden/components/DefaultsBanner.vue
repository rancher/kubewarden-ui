<script>
import { mapGetters } from 'vuex';

import { Banner } from '@components/Banner';
import { KUBEWARDEN_CHARTS } from '../types';

export default {
  components: { Banner },

  computed: {
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
        this.$store.dispatch('growl/fromError', e);
      }

      if ( !this.defaultsChart && retry === 0 ) {
        await this.refreshCharts(retry + 1);
      }
    },

    async chartRoute() {
      if ( !this.defaultsChart ) {
        try {
          await this.refreshCharts();
        } catch (e) {
          this.$store.dispatch('growl/fromError', e);

          return;
        }
      }

      this.defaultsChart.goToInstall(KUBEWARDEN_CHARTS.DEFAULTS);
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
