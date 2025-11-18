<template>
  <div class="scan-interval-cell">
    <span
      v-if="value"
      class="scan-interval-text"
    >{{ t('imageScanner.general.every') }}&nbsp;{{ value }}</span>
    <span
      v-else
      class="scan-interval-text scan-interval-none"
    >n/a</span>
  </div>
</template>
<script>
export default {
  props: {
    value: {
      type:     String,
      required: true
    }
  },
};
</script>

<style lang="scss" scoped>
.scan-interval-cell {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);

  .scan-interval-text {
    margin-left: 8px;
    &.scan-interval-none {
      color: var(--disabled-text);
    }
  }
}
</style>
