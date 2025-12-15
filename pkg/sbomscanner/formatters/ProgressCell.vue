<script>
import TextWithPoppedDetail from '@sbomscanner/components/common/TextWithPoppedDetail';
export default {
  props: {
    value: {
      type:     Object,
      required: true
    },
  },
  components: { TextWithPoppedDetail },
  name:       'ProgressCell',
};
</script>
<template>
  <div class="progress-cell">
    <span v-if="value.progress !== undefined && value.progress !== null">
      <TextWithPoppedDetail
        :value="`${value.progress}%`"
        :detail="{ title: `${value.metadata?.name || value.registryName} - ${value.progress}%`, message: value.progressDetail, type: 'info' }"
      />
      <span v-if="value.error">|
        <TextWithPoppedDetail
          :value="t('imageScanner.general.error')"
          :detail="{title: `${value.metadata?.name} - ${t('imageScanner.registries.configuration.scanTable.header.error')}`, message: value.error, type: 'error' }"
        />
      </span>
    </span>
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
