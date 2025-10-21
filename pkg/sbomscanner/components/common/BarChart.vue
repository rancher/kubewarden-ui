<template>
  <div class="severity-bar-chart">
    <div class="severity-heading">
      <span class="vul-total">{{ total }}</span>
      <span class="vul-desc">{{ description }}</span>
    </div>
    <div class="severity-chart">
      <div
        v-for="(value, key) in chartData"
        :key="key"
        class="severity-item"
      >
        <div
          class="severity-item-name"
          @click="filterByCategory(key)"
        >
          {{ t(`imageScanner.enum.${ colorPrefix }.${ key.toLowerCase() }`) }}
        </div>
        <PercentageBar
          class="severity-item-bar"
          :color-stops="{0: `--${ colorPrefix }-${ key.toLowerCase() }`}"
          :value="percentage(value)"
          :height="7"
        />
        <div class="severity-item-value">
          {{ value }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PercentageBar from '@pkg/components/rancher-rewritten/shell/components/PercentageBar';

export default {
  name:       'BarChart',
  components: { PercentageBar },
  props:      {
    chartData: {
      type:     Object,
      required: true
    },
    description: {
      type:     String,
      required: true
    },
    colorPrefix: {
      type:     String,
      required: true
    },
    filterFn: {
      type:     Function,
      required: false,
      default:  null
    },
  },
  methods: {
    percentage(value) {
      return this.total > 0 ? (value / this.total) * 100 : 0;
    },
    filterByCategory(category) {
      this.filterFn && this.filterFn(category);
    }
  },
  computed: {
    total() {
      return Object.values(this.chartData).reduce((sum, value) => sum + value, 0);
    },
  }
};
</script>

<style lang="scss" scoped>
  .severity-bar-chart {
    display: flex;
    padding: 8px 0px;
    align-items: flex-start;
    gap: 24px;
    align-self: stretch;

    .severity-heading {
      display: flex;
      flex: 1;
      width: 160px;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 4px;
      align-self: stretch;

      .vul-total {
        font-family: Lato;
        font-size: 24px;
        font-style: normal;
        font-weight: 800;
        line-height: normal;
      }

      .vul-desc {
        font-family: Lato;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
        text-align: center;
        color: var(--disabled-text);
      }
    }

    .severity-chart {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 3;
      .severity-item {
        display: flex;
        align-items: center;
        margin: 2px 0;
        gap: 12px;

        .severity-item-name {
          width: 80px;
          align-items: right;
          gap: 12px;
          text-decoration: underline;
          cursor: pointer;
        }

        .severity-item-bar {
          flex: 1;
          overflow: hidden;
        }

        .severity-item-value {
          width: 50px;
          text-align: right;
          align-items: left;
          gap: 12px;
        }
      }
    }

    --cve-critical: #880E1E;
    --cve-high: #DE2136;
    --cve-medium: #FF8533;
    --cve-low: #EEC707;
    --cve-none: #DCDEE7;
    --border: #F4F5FA;

    --status-pending: #DCDEE7;
    --status-scheduled: #0FCFF0;
    --status-inprogress: #3D98D3;
    --status-complete: #5BB04F;
    --status-failed: #DE2136;
  }
</style>
