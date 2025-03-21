<script>
export default {
  props: {
    gauges: {
      type:     Object,
      required: true
    },
    modeLink: {
      type:     Function,
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
    <div>
      <span>{{ gauges.mode.protect }}</span>
      <router-link
        class="modeLink"
        :to="modeLink({ q: 'protect' })"
      >
        {{ t('kubewarden.dashboard.headers.modes.protect') }}
      </router-link>
    </div>

    <span>&nbsp;/&nbsp;</span>

    <div>
      <span>{{ gauges.mode.monitor }}</span>
      <router-link
        class="modeLink"
        :to="modeLink({ q: 'monitor' })"
      >
        {{ t('kubewarden.dashboard.headers.modes.monitor') }}
      </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modeLink {
  color: var(--body-text);
  text-decoration: none;
  cursor: pointer;
}
</style>