<script>
import isEmpty from 'lodash/isEmpty';
import { sortBy } from '@shell/utils/sort';

import { colorForResult, getFilteredSummary } from '../modules/policyReporter';

export default {
  props: {
    value: {
      type:     Object,
      default:  () => {}
    }
  },

  computed: {
    canShow() {
      if ( !isEmpty(this.summary) ) {
        const counts = [];

        for ( const obj of Object.keys(this.summary) ) {
          if ( this.summary[obj] ) {
            counts.push(this.summary[obj]);
          }
        }

        return !!counts.length;
      }

      return false;
    },

    colorParts() {
      const out = {};

      for ( const p of this.summaryParts ) {
        out[p.color] = {
          color: p.color,
          label: p.label,
          value: p.value
        };
      }

      return sortBy(Object.values(out), 'sort:desc').reverse();
    },

    summary() {
      return getFilteredSummary(this.$store, this.value);
    },

    summaryParts() {
      const out = {};

      for ( const [result, value] of Object.entries(this.summary) ) {
        const textColor = colorForResult(result);
        const replacedTextColor = textColor.includes('sizzle') ? textColor : textColor.replace(/text-/, 'bg-');
        const bgColor = textColor.includes('sizzle') ? textColor.concat('-bg') : textColor.replace(/text-/, 'bg-');
        const key = `${ textColor }/${ result }`;

        out[key] = {
          key,
          label:           result.charAt(0).toUpperCase() + result.slice(1),
          color:           replacedTextColor,
          bgColor,
          textColor,
          value,
          sort:            this.policySummarySort(textColor, result),
        };
      }

      return sortBy(Object.values(out), 'sort:desc').reverse();
    },
  },

  methods: {
    policySummarySort(color, display) {
      const SORT_ORDER = {
        fail:    1,
        pass:    2,
        error:   3,
        warning: 4,
        skip:    5,
        other:   6
      };

      color = color.replace(/^(text|bg|sizzle)-/, '');

      return `${ SORT_ORDER[display] || SORT_ORDER['other'] } ${ display }`;
    }
  }
};
</script>

<template>
  <!-- <Loading v-if="$fetchState.pending" mode="relative" /> -->
  <div v-if="canShow" class="pr-summary">
    <v-popover
      class="text-center hand"
      placement="top"
      :open-group="value.id"
      trigger="click"
      offset="1"
    >
      <template>
        <div class="pr-summary__container">
          <div v-for="obj in summaryParts" :key="`${obj.key}-badge`">
            <div v-if="obj.value" class="badge" :class="{[obj.bgColor]: true}">
              <span v-clean-tooltip="obj.label">{{ obj.value }}</span>
            </div>
          </div>
        </div>
      </template>

      <template #popover>
        <div class="pr-summary__content">
          <div>
            <div v-for="obj in summaryParts" :key="obj.key" class="counts">
              <span class="text-left pr-20" :class="{[obj.textColor]: true}">
                {{ obj.label }}
              </span>
              <span class="text-right">
                {{ obj.value }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </v-popover>
  </div>
  <div v-else></div>
</template>

<style lang="scss" scoped>
$height: 30px;
$width: 143px;
$error: #614EA2;

.pr-summary {
  position: relative;

  &__container {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    width: $width;
    height: $height;

    border: solid thin var(--sortable-table-top-divider);

    .badge {
      padding: 4px;
      margin: 2px;
      border-radius: 8px;
    }

    .sizzle-warning-bg {
      background-color: $error;
      color: #fff;
    }
  }

  &__content {
    z-index: 14;
    width: $width;

    & > div {
      padding: 10px;
    }

    .counts {
      display: flex;
      justify-content: space-between;
    }

    // Need to override the default colors for these classes
    .text-warning {
      color: var(--warning) !important;
    }

    .text-darker {
      color: var(--dark) !important;
    }

    .sizzle-warning {
      color: $error;
    }
  }
}
</style>