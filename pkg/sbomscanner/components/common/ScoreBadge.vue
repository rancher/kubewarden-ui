<template>
  <div
    class="badge"
    :class="computedSeverity"
  >
    <div
      v-if="score && scoreType"
      class="text"
    >
      {{ score }} ({{ scoreType }})
    </div>
    <div
      v-else
      class="text na"
    >
      n/a
    </div>
  </div>
</template>

<script>
import { SEVERITY } from '@pkg/types/image';
export default {
  name:  'ScoreBadge',
  props: {
    score: {
      type:    String,
      default: ''
    },
    scoreType: {
      type:    String,
      default: ''
    },
    severity: {
      type:    String,
      default: ''
    }
  },
  computed: {
    computedSeverity() {
      if (!this.severity) {
        return 'na';
      }

      if (this.severity.toLowerCase() === SEVERITY.CRITICAL) {
        return SEVERITY.CRITICAL;
      } else if (this.severity.toLowerCase() === SEVERITY.HIGH) {
        return SEVERITY.HIGH;
      } else if (this.severity.toLowerCase() === SEVERITY.MEDIUM) {
        return SEVERITY.MEDIUM;
      } else {
        return SEVERITY.LOW;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
  .badge {
    /* layout */
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1 0 0;
    align-self: stretch;
    /* style */
    border-radius: 4px;

    &.critical {
      background: #850917;
    }

    &.high {
      background: #DE2136;
    }

    &.medium {
      background: #FF8533;
    }

    &.low {
      background: #EEC707;
    }

    &.na{
      background: #DCDEE7;
    }

    .text {
      color: rgba(255, 255, 255, 0.90);
      font-family: Lato;
      font-size: 13px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px; /* 153.846% */
      &.na {
        color: #717179;
      }
    }
  }
</style>
