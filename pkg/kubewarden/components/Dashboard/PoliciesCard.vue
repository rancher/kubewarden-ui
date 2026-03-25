<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import StatusRow from '@shell/components/Resource/Detail/StatusRow.vue';

import PoliciesSummary from './PoliciesSummary.vue';
import ReportSummary from './ReportSummary.vue';
import { computed } from 'vue';

const store = useStore();
const { t } = useI18n(store);

const props = defineProps<{
  results: any;
  stats: any;
  showReports: boolean;
  protectLink: object;
  monitorLink: object;
  createLink: object;
  dataTestId: string;
}>();

const reportsCount = computed(() => props.results ? props.results.rows[0].count + props.results.rows[1].count : 0);
</script>

<template>
  <div class="policies-card">
    <template v-if="results">
      <PoliciesSummary
        :protect="stats.mode.protect"
        :monitor="stats.mode.monitor"
        :protectLink="protectLink"
        :monitorLink="monitorLink"
        :createLink="createLink"
      />
      <VerticalGap />
      <ReportSummary
        :reports="reportsCount"
      />
      <VerticalGap />

      <!-- Reports chart -->
      <template v-if="!!reportsCount && showReports">
        <VerticalGap />
        <StatusBar :segments="results.rows" />
        <StatusRow
          class="policies-card__results"
          v-for="(row, i) in results.rows"
          :data-testid="dataTestId"
          :key="`row-${i}`"
          :color="row.color"
          :label="t(row.label)"
          :count="row.count"
          :percent="row.percent"
        />
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.policies-card {
  width: 100%;

  &__results {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
  }
}
</style>
