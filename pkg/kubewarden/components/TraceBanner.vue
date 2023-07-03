<script>
import { Banner } from '@components/Banner';

export default {
  props: {
    openTelemetryService: {
      type:    Object,
      default: null
    },
    jaegerService: {
      type:    Object,
      default: null
    }
  },

  components: { Banner }
};
</script>

<template>
  <div>
    <Banner color="warning">
      <span v-if="!openTelemetryService" v-clean-html="t('kubewarden.tracing.noOpenTelemetry', {}, true)" />
      <span v-else-if="!jaegerService" v-clean-html="t('kubewarden.tracing.noJaeger', {}, true)" />
      <span v-else>{{ t('kubewarden.tracing.noRelatedTraces') }}</span>
    </Banner>
  </div>
</template>