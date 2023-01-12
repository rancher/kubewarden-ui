<script>
import { isEmpty } from 'lodash';

import { Banner } from '@components/Banner';

export default {
  components: { Banner },

  methods: {
    async closeDefaultsBanner(retry = 0) {
      const res = await this.$store.dispatch('kubewarden/updateHideDefaultsBanner', true);

      if ( retry === 0 && res?.type === 'error' && res?.status === 500 ) {
        await this.closeDefaultsBanner(retry + 1);
      }
    },

    async setChartRoute(retry = 0) {
      // Check to see that `kubewarden-defaults` chart is available
      const charts = this.$store.getters['catalog/rawCharts'];

      if ( isEmpty(charts) && retry === 0 ) {
        await this.$store.dispatch('catalog/load');

        await this.setChartRoute(retry + 1);
      }

      const chartValues = Object.values(charts);

      const controllerChart = chartValues.find(
        chart => chart.chartName === 'kubewarden-defaults'
      );

      if ( controllerChart ) {
        return controllerChart.goToInstall('kubewarden-defaults');
      }
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
    <p v-html="t('kubewarden.policyServer.noDefaultsInstalled.description', {}, true)"></p>
    <button
      class="btn role-primary mt-10"
      @click.prevent="setChartRoute"
    >
      {{ t("kubewarden.policyServer.noDefaultsInstalled.button") }}
    </button>
  </Banner>
</template>
