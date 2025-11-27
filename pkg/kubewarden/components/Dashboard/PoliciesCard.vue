<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import StatusRow from '@shell/components/Resource/Detail/StatusRow.vue';

import PoliciesSummary from './PoliciesSummary.vue';
import EmptyPolicies from './EmptyPolicies.vue';

const store = useStore();
const { t } = useI18n(store);

defineProps<{
  stats: any;
  showReports: boolean;
  emptyLabel: string;
  protectLink: string;
  monitorLink: string;
  dataTestId: string;
}>();
</script>

<template>
  <div class="policies-card">
    <template v-if="stats">
      <PoliciesSummary
        :protect="stats.mode.protect"
        :monitor="stats.mode.monitor"
        :protectLink="protectLink"
        :monitorLink="monitorLink"
      />
      <VerticalGap />
      <template v-if="showReports">
        <StatusBar :segments="stats.rows" />
        <VerticalGap />
        <StatusRow
          class="policies-card__stats"
          v-for="(row, i) in stats.rows"
          :data-testid="dataTestId"
          :key="`row-${i}`"
          :color="row.color"
          :label="t(row.label)"
          :count="row.count"
          :percent="row.percent"
        />
      </template>
    </template>
    <EmptyPolicies v-else :label="emptyLabel" />
  </div>
</template>

<style lang="scss" scoped>
.policies-card {
  width: 100%;

  &__stats {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
  }
}
</style>
