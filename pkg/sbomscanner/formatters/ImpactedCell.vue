<template>
  <div class="impacted-container">
    <div class="impacted">
      <span>{{ value }}</span>
      <BlockPercentageBarAlt
        :ticks="col.formatterParams?.ticks || 10"
        :percentage="(row.spec.totalImages && value) ? (value / row.spec.totalImages) * 100 : 0"
      />
    </div>
  </div>
</template>

<script>
import BlockPercentageBarAlt from '@pkg/components/common/BlockPercentageBarAlt.vue';

export default {
  components: { BlockPercentageBarAlt },
  props:      {
    value: {
      type:     Number,
      required: true
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      required: true
    }
  },
};
</script>

<style lang="scss" scoped>
  .impacted-container {
    display: flex;
    padding: 0 16px;
    align-items: center;
    justify-content: end;
  }

  .impacted {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 16px;
    flex: 1 0 0;
    align-self: stretch;
  }
</style>
