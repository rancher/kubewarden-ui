<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

const store = useStore();
const { t } = useI18n(store);

defineProps<{
  reports: number;
}>();
</script>

<template>
  <div class="policies-summary">
    <span class="policies-summary__title">{{ t('kubewarden.generic.reports') }}</span>
    <div class="policies-summary__stats" v-if="reports > 0">{{ t('kubewarden.dashboard.cards.generic.reports.total', { count: reports }) }}</div>
    <div class="policies-summary__stats policies-summary__stats--disabled" v-else>{{ t('kubewarden.dashboard.cards.generic.reports.empty') }}</div>
  </div>
</template>
<style scoped lang="scss">
.policies-summary {
  display: flex;
  justify-content: space-between;
  width: 100%;

  &__title {
    font-weight: 600;
  }

  &__stats {
    display: flex;
    gap: 0.5rem;
    align-items: center;

    &--disabled {
      color: var(--disabled-text);
    }
  }
}
</style>
