<script>
import { mapGetters } from 'vuex';
import { monitoringStatus } from '@shell/utils/monitoring';

import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';

export default {
  name: 'MetricsBanner',

  props: {
    metricsService: {
      type:     [Boolean, Object],
      default:  null
    },
    metricsType: {
      type:     String,
      required: true
    },
    reloadRequired: {
      type:     Boolean,
      default:  false
    }
  },

  components: { AsyncButton, Banner },

  async fetch() {
    if ( !this.monitoringChart ) {
      await this.$store.dispatch('catalog/load');
    }

    this.grafanaDashboard = await this.value?.grafanaDashboard();
  },

  data() {
    return { grafanaDashboard: null };
  },

  computed: {
    ...mapGetters(['currentProduct']),
    ...mapGetters({ charts: 'catalog/charts' }),
    ...monitoringStatus(),

    monitoringChart() {
      if ( this.rancherRepo ) {
        return this.$store.getters['catalog/chart']({
          repoName:  this.kubewardenRepo.repoName,
          repoType:  this.kubewardenRepo.repoType,
          chartName: 'rancher-monitoring'
        });
      }

      return null;
    },

    rancherRepo() {
      return this.charts?.find(chart => chart.chartName === 'rancher-monitoring');
    }
  },

  methods: {
    // Used when ConfigMap is added, reload to see updated Grafana dashboard
    reload() {
      this.$router.go();
    },

    chartRoute() {
      this.monitoringChart?.goToInstall();
    }
  }
};
</script>

<template>
  <div v-if="!monitoringStatus.installed">
    <Banner color="warning" data-testid="kw-metrics-not-installed-banner">
      <span v-clean-html="t('kubewarden.monitoring.notInstalled', {}, true)" />
      <button
        data-testid="kw-metrics-banner-install-button"
        class="btn role-primary ml-10"
        @click.prevent="chartRoute"
      >
        {{ t("kubewarden.policyServer.noDefaultsInstalled.button") }}
      </button>
    </Banner>
  </div>

  <div v-else-if="!grafanaDashboard">
    <Banner color="warning">
      <template v-if="!reloadRequired">
        <p class="mb-20">
          {{ t('kubewarden.metrics.notInstalled' ) }}
        </p>
        <AsyncButton
          data-testid="kw-metrics-banner-add-dashboard-button"
          mode="grafanaDashboard"
          @click="$emit('add', $event)"
        />
      </template>
      <template v-else>
        <i class="icon icon-checkmark mr-10" />
        <span class="mb-20">
          {{ t('kubewarden.metrics.reload' ) }}
        </span>
        <button class="ml-10 btn btn-sm role-primary" @click="reload()">
          {{ t('generic.reload') }}
        </button>
      </template>
    </Banner>
  </div>

  <div v-else-if="!metricsService">
    <Banner color="error">
      <i class="icon icon-checkmark mr-10" />
      <span class="mb-20" data-testid="kw-metrics-banner-no-service">
        {{ t('kubewarden.metrics.noService' ) }}
      </span>
    </Banner>
  </div>
</template>
