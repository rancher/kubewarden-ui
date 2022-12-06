<script>
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
    monitoringRoute: {
      type:     Object,
      default:  null
    },
    reloadRequired: {
      type:     Boolean,
      default:  false
    }
  },

  components: { AsyncButton, Banner },

  computed: { ...monitoringStatus() },

  methods: {
    // Used when ConfigMap is added, reload to see updated Grafana dashboard
    reload() {
      this.$router.go();
    },
  }
};
</script>

<template>
  <div v-if="!monitoringStatus.installed">
    <Banner color="warning">
      <span v-html="t('kubewarden.monitoring.notInstalled', {}, true)" />
      <nuxt-link :to="monitoringRoute">
        {{ t('kubewarden.monitoring.install') }}
      </nuxt-link>
    </Banner>
  </div>

  <div v-else-if="!metricsService">
    <Banner color="warning">
      <template v-if="!reloadRequired">
        <p class="mb-20">
          {{ t('kubewarden.metrics.notInstalled' ) }}
        </p>
        <AsyncButton
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
</template>
