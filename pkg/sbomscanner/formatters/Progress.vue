<script>
export default {
  props: {
    value: {
      type:     Number,
      required: true
    },
  },
  name: 'ProgressCell',
};
</script>
<template>
  <div class="progress-cell">
    <span
      v-if="value"
      class="progress-text"
    >{{ value }}%</span>
    <span
      v-else
      class="progress-text none"
    >n/a</span>
  </div>
</template>
<style lang="scss" scoped>
.progress-cell {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);

  .progress-text {
    margin-left: 8px;
    &.none {
      color: var(--disabled-text);
      margin-left: 12px;
    }
  }
}
</style>
