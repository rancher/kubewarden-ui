<template>
  <div class="scan-interval-cell">
    <span
      v-if="value"
      class="scan-interval-text"
    >{{ t('imageScanner.general.every') }}&nbsp;{{ scanInterval }}</span>
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
  computed: {
    scanInterval() {
      const regex = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
      const matches = this.value.match(regex);

      if (!matches) {
        return this.value;
      }

      const [, hours, minutes, seconds] = matches;
      let result = '';

      if (hours && hours !== '0') {
        result += `${hours}h`;
      }

      if (minutes && minutes !== '0') {
        result += `${minutes}m`;
      }

      if (seconds && seconds !== '0') {
        result += `${seconds}s`;
      }

      return result || this.value;
    }
  }
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
