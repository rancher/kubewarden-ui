<template>
  <div class="chart-section">
    <div class="title">
      {{ title }}
      <i
        v-if="tooltip"
        v-clean-tooltip="tooltip"
        class="icon icon-question-mark"
      ></i>
    </div>
    <div class="bar-chart">
      <BarChart
        :filter-fn="filterFn"
        :chart-data="chartData"
        :color-prefix="colorPrefix"
        :description="description"
      />
    </div>
  </div>
</template>

<script>
import BarChart from '@pkg/components/common/BarChart';

export default {
  name:       'DistributionChart',
  components: { BarChart },
  props:      {
    title: {
      type:     String,
      required: true,
    },
    chartData: {
      type:     Object,
      required: true
    },
    filterFn: {
      type:     Function,
      required: false,
      default:  null
    },
    colorPrefix: {
      type:     String,
      required: true,
    },
    description: {
      type:     String,
      required: true,
    },
    tooltip: {
      type:     String,
      required: false,
      default:  ''
    }
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
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: Lato;
            font-size: 18px;
            font-style: normal;
            font-weight: 400;
            line-height: 21px; /* 116.667% */
        }
        .bar-chart {
            padding: 4px 8px;
            align-items: center;
            align-self: stretch;
        }
    }
</style>
