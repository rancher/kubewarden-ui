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
  <div class="mb-20 events">
    <h4 class="text-bold mb-0">
      {{ t('kubewarden.dashboard.headers.events.title') }}:&nbsp;
    </h4>
    <span class="text-success">{{ gauges.status.success }} {{ t('kubewarden.dashboard.headers.events.success') }}</span>
    <span>&nbsp;/&nbsp;</span>
    <span class="text-error">{{ gauges.status.fail }} {{ t('kubewarden.dashboard.headers.events.fail') }}</span>
    <span>&nbsp;/&nbsp;</span>
    <span class="event-error">{{ gauges.status.error }} {{ t('kubewarden.dashboard.headers.events.error') }}</span>
  </div>
</template>

<style scoped>
.event-error {
  color: var(--app-color4-accent);
}
</style>
