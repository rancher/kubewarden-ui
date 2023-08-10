<script>
import isEmpty from 'lodash/isEmpty';
import { Banner } from '@components/Banner';

export default {
  props: {
    openTelemetryService: {
      type:    Array,
      default: () => []
    },
    jaegerService: {
      type:    Object,
      default: null
    }
  },

  components: { Banner },

  methods: {
    hasService(service) {
      return !!isEmpty(service);
    }
  }
};
</script>

<template>
  <div>
    <Banner color="warning">
      <span v-if="!hasService(openTelemetryService) " v-clean-html="t('kubewarden.tracing.noOpenTelemetry', {}, true)" data-testid="kw-trace-banner-no-telemetry" />
      <span v-else-if="!hasService(jaegerService)" v-clean-html="t('kubewarden.tracing.noJaeger', {}, true)" data-testid="kw-trace-banner-no-jaeger" />
      <span v-else data-testid="kw-trace-banner-no-traces">{{ t('kubewarden.tracing.noRelatedTraces') }}</span>
    </Banner>
  </div>
</template>