<template>
  <div v-if="isCollapsed">
    <StackedPercentageBar
      :percentages="pecentages"
      :primary-colors="['#880E1E','#D32F2F','#FB8C00','#FDD835','#E0E0E0','#F4F5FA']"
      :height="7"
    />
  </div>
  <div v-else>
    <div class="bar">
      <div
        class="badge"
        :class="badgeColor('critical', cveAmount.critical)"
      >
        {{ cveAmount.critical }}
      </div>
      <div
        class="badge"
        :class="badgeColor('high', cveAmount.high)"
      >
        {{ cveAmount.high }}
      </div>
      <div
        class="badge"
        :class="badgeColor('medium', cveAmount.medium)"
      >
        {{ cveAmount.medium }}
      </div>
      <div
        class="badge"
        :class="badgeColor('low', cveAmount.low)"
      >
        {{ cveAmount.low }}
      </div>
      <div
        class="badge"
        :class="badgeColor('unknown', cveAmount.unknown)"
      >
        {{ cveAmount.unknown }}
      </div>
    </div>
  </div>
</template>

<script>
import StackedPercentageBar from '@pkg/components/common/StackedPercentageBar';
export default {
  name:       'AmountBarBySeverity',
  components: { StackedPercentageBar },
  props:      {
    cveAmount: {
      type:    Object,
      default: () => ({}),
    },
    isCollapsed: {
      type:    Boolean,
      default: false,
    }
  },
  methods: {
    badgeColor(severity, cnt) {
      const _class = {};
      const className = cnt > 0 ? severity : 'zero';

      _class[className] = true;

      return _class;
    }
  },
  computed: {
    pecentages() {
      const total = this.cveAmount.critical + this.cveAmount.high + this.cveAmount.medium + this.cveAmount.low + this.cveAmount.unknown;

      return [
        this.cveAmount.critical * 100 / total,
        this.cveAmount.high * 100 / total,
        this.cveAmount.medium * 100 / total,
        this.cveAmount.low * 100 / total,
        this.cveAmount.unknown * 100 / total,
      ];
    }
  }
};
</script>

<style lang="scss" scoped>
  .bar {
    display: flex;
    border-radius: 4px;
    overflow: hidden;
    font-family: sans-serif;
    color: white;
    font-weight: bold;
    text-align: center;
    height: 24px;
    align-items: center;

    .badge {
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 1 0 0;
      align-self: stretch;
      padding: 0px 2px;
      font-family: Lato;
      font-size: 13px;
      font-style: normal;
      font-weight: 400;
      line-height: 20px; /* 153.846% */
    }
    .badge.critical {
      background-color: #880E1E;
      color: rgba(255, 255, 255, 0.90);
    }
    .badge.high {
      background-color: #D32F2F;
      color: rgba(255, 255, 255, 0.90);
    }
    .badge.medium {
      background-color: #FB8C00;
      color: rgba(255, 255, 255, 0.90);
    }
    .badge.low {
      background-color: #FDD835;
      color: rgba(255, 255, 255, 0.90);
    }
    .badge.unknown {
      background-color: #E0E0E0;
      color: #717179;
    }
    .badge.zero {
      background-color: #F4F5FA;
      color: #BEC1D2;
    }
  }
</style>
