<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { useStore } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { sortBy } from '@shell/utils/sort';

import { Result, PolicyReportSummary } from '../types';
import { colorForResult } from '../modules/policyReporter';

const attrs = useAttrs();

interface ValueType {
  id?: string;
  [key: string]: any;
}

const props = defineProps<{ value?: ValueType }>();
const store = useStore();

const loadingReports = computed(() => store.getters['kubewarden/loadingReports']);

const summary = computed<PolicyReportSummary>(() => {
  const resourceId = props.value?.id;

  return store.getters['kubewarden/summaryByResourceId'](resourceId);
});

// Determine if there’s anything to show by checking for non-empty summary counts
const canShow = computed(() => {
  const s = summary.value;

  if (!isEmpty(s)) {
    const counts = Object.values(s).filter(Boolean);

    return counts.length > 0;
  }

  return false;
});

function policySummarySort(color: string, display: string): string {
  const SORT_ORDER: Record<string, number> = {
    fail:    1,
    pass:    2,
    error:   3,
    warning: 4,
    skip:    5,
    other:   6
  };

  color = color.replace(/^(text|bg|sizzle)-/, '');

  return `${ SORT_ORDER[display] || SORT_ORDER.other } ${ display }`;
}

// Build the summary parts array with additional display data and sort order
const summaryParts = computed(() => {
  const out: Record<string, any> = {};

  for (const [result, value] of Object.entries(summary.value) as [Result, number][]) {
    const textColor = colorForResult(result);

    const replacedTextColor = textColor.includes('sizzle') ? textColor : textColor.replace(/text-/, 'bg-');
    const bgColor = textColor.includes('sizzle') ? textColor.concat('-bg') : textColor.replace(/text-/, 'bg-');

    const key = `${ textColor }/${ result }`;

    out[key] = {
      key,
      label: result.charAt(0).toUpperCase() + result.slice(1),
      color: replacedTextColor,
      bgColor,
      textColor,
      value,
      sort:  policySummarySort(textColor, result)
    };
  }

  return sortBy(Object.values(out), 'sort:desc', 'desc').reverse();
});
</script>

<template>
  <div v-bind="attrs">
    <div v-if="loadingReports" data-testid="resource-tab-loading">
      <i class="icon icon-lg icon-spinner icon-spin" />
    </div>
    <div v-else-if="canShow" class="pr-summary">
      <VDropdown class="text-center hand" placement="top" :open-group="props?.value?.id" trigger="click" offset="1">
        <div class="pr-summary__container">
          <div v-for="obj in summaryParts" :key="`${obj.key}-badge`">
            <div v-if="obj.value" class="badge" :class="{ [obj.bgColor]: true }">
              <span v-clean-tooltip="obj.label">{{ obj.value }}</span>
            </div>
          </div>
        </div>

        <template #popper>
          <div class="pr-summary__content">
            <div>
              <div v-for="obj in summaryParts" :key="obj.key" class="counts">
                <span class="text-left pr-20" :class="{ [obj.textColor]: true }">
                  {{ obj.label }}
                </span>
                <span class="text-right">
                  {{ obj.value }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </VDropdown>
    </div>
    <div v-else>-</div>
  </div>
</template>

<style lang="scss" scoped>
$height: 30px;
$width: 100%;
$error: #614ea2;

.pr-summary {
  position: relative;

  &__container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: $width;
    height: $height;

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

    &>div {
      padding: 10px;
    }

    .counts {
      display: flex;
      justify-content: space-between;
    }

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
