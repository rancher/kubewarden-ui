<script>
import TextWithPopedDetail from '@pkg/components/common/TextWithPopedDetail';
export default {
  props: {
    value: {
      type:     Object,
      required: true
    },
    row: {
      type:     Object,
      required: true
    }
  },
  components: { TextWithPopedDetail },
  name:       'ProgressCell',
};
</script>
<template>
  <div class="progress-cell">
    <span v-if="value.progress !== undefined && value.progress !== null">
      <TextWithPopedDetail
        :value="`${value.progress}%`"
        :detail="{ title: `${value.metadata?.name || value.registryName} - ${value.progress}%`, message: value.progressDetail, type: 'info' }"
      />
      <span v-if="value.error">|
        <TextWithPopedDetail
          :value="t('imageScanner.general.error')"
          :detail="{title: `${value.metadata?.name} - ${t('imageScanner.registries.configuration.scanTable.header.error')}`, message: value.error, type: 'error' }"
        />
      </span>
    </span>
    <span
      v-else
      class="progress-text text-muted none"
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
      margin-left: 12px;
    }
  }
}
</style>
