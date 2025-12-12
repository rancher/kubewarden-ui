<template>
  <div class="chart-section">
    <div class="title">
      {{ t('imageScanner.images.imageRiskAssessment.title') }}
    </div>
    <div class="severity-bar-chart">
      <BarChart
        :chart-data="chartData"
        color-prefix="cve"
        :filter-fn="filterFn"
        :description="t('imageScanner.images.imageRiskAssessment.subTitle')"
      />
    </div>
  </div>
</template>

<script>
import BarChart from '@sbomscanner/components/common/BarChart';

export default {
  name:       'ImageRiskAssessment',
  components: { BarChart },
  props:      {
    chartData: {
      type:     Object,
      required: true
    },
    filterFn: {
      type:     Function,
      required: false,
      default:  null
    },
  },
};
</script>

<style lang="scss" scoped>
    .chart-section {
        display: flex;
        padding: 16px;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        flex: 1 0 0;
        .title {
            color: #141419;
            font-family: Lato;
            font-size: 18px;
            font-style: normal;
            font-weight: 400;
            line-height: 21px; /* 116.667% */
        }
        .severity-bar-chart {
            padding: 4px 8px;
            align-items: center;
            align-self: stretch;
        }
    }
</style>
