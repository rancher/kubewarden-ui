<template>
  <i
    v-if="tooltip"
    v-clean-tooltip="tooltip"
    class="icon icon-question-mark tooltip"
  ></i>
</template>

<script>
export default {
  name:  'InfoTooltip',
  props: {
    tooltip: {
      type:    String,
      default: ''
    }
  }
};
</script>

<style lang="scss" scoped>
  .tooltip {
    color: var(--disabled-text);
  }
</style>
