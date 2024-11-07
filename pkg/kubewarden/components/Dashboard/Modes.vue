<script>
export default {
  props: {
    gauges: {
      type:     Object,
      required: true
    }
  }
};
</script>

<template>
  <div class="modes">
    <h4 class="text-bold mb-0">
      {{ t('kubewarden.dashboard.headers.modes.title') }}:&nbsp;
    </h4>
    <span>{{ gauges.mode.protect }} {{ t('kubewarden.dashboard.headers.modes.protect') }}</span>
    <span>&nbsp;/&nbsp;</span>
    <span>{{ gauges.mode.monitor }} {{ t('kubewarden.dashboard.headers.modes.monitor') }}</span>
  </div>
</template>

<style scoped>
/* Your styles */
</style>
