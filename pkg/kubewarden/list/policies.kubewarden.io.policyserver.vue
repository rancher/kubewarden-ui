<script>
import { CATALOG } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  components: {
    Banner, Loading, ResourceTable
  },

  props: {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });

    await this.$store.dispatch('catalog/load');

    // Determine if the default PolicyServer is installed from the `kubewarden-defaults` chart
    const apps = await this.$store.dispatch('cluster/findAll', { type: CATALOG.APP });

    this.hasDefaults = apps.find((a) => {
      return a.spec.chart.metadata.annotations[CATALOG_ANNOTATIONS.RELEASE_NAME] === 'rancher-kubewarden-defaults';
    });
  },

  data() {
    return {
      hasDefaults: null,
      rows:        null
    };
  },

  methods: {
    setChartRoute() {
      // Check to see that `kubewarden-defaults` chart is available
      const charts = this.$store.getters['catalog/rawCharts'];
      const chartValues = Object.values(charts);

      const controllerChart = chartValues.find(
        chart => chart.chartName === 'kubewarden-defaults'
      );

      if ( controllerChart ) {
        return controllerChart.goToInstall('kubewarden-defaults');
      }

      return null;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner
      v-if="!hasDefaults"
      class="mb-20 mt-0"
      color="info"
      :closable="true"
    >
      <p v-html="t('kubewarden.policyServer.noDefaultsInstalled.description', {}, true)"></p>
      <button
        class="btn role-primary mt-10"
        @click.prevent="setChartRoute"
      >
        {{ t("kubewarden.policyServer.noDefaultsInstalled.button") }}
      </button>
    </Banner>
    <ResourceTable
      :schema="schema"
      :rows="rows"
    />
  </div>
</template>
