<template>
  <div v-if="isCollapsed">
    <StackedPercentageBar
      :percentages="percentages"
      :height="7"
      :primary-classes="severityClasses"
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
import StackedPercentageBar from '@sbomscanner/components/common/StackedPercentageBar';
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
    percentages() {
      const total = this.cveAmount.critical + this.cveAmount.high + this.cveAmount.medium + this.cveAmount.low + this.cveAmount.unknown;

      return [
        this.cveAmount.critical * 100 / total,
        this.cveAmount.high * 100 / total,
        this.cveAmount.medium * 100 / total,
        this.cveAmount.low * 100 / total,
        this.cveAmount.unknown * 100 / total,
      ];
    },
    severityClasses() {
      return [
        'critical',
        'high',
        'medium',
        'low',
        'unknown'
      ];
    }
  }
};
</script>
<style lang="scss" scoped>
  @import '../../styles/_variables.scss';

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
      background-color: $critical-color;
      color: rgba(255, 255, 255, 0.90);
    }
    .badge.high {
      background-color: $high-color;
      color: rgba(255, 255, 255, 0.90);
    }
    .badge.medium {
      background-color: $medium-color;
      color: rgba(255, 255, 255, 0.90);
    }
    .badge.low {
      background-color: $low-color;
      color: $low-na-text;
    }
    .badge.unknown {
      background-color: $na-color;
      color: $low-na-text;
    }
    .badge.zero {
      color: $zero-text;
      // Default to light theme color
      background-color: $zero-color-light;

      body.theme-dark & {
        background-color: $zero-color-dark;
      }
    }
  }

  // Add styles for StackedPercentageBar classes
  ::v-deep(.critical) { background-color: $critical-color; }
  ::v-deep(.high) { background-color: $high-color; }
  ::v-deep(.medium) { background-color: $medium-color; }
  ::v-deep(.low) { background-color: $low-color; }
  ::v-deep(.unknown) { background-color: $na-color; }
</style>
