<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import SubtleLink from '@kubewarden/components/SubtleLink.vue';
import EmptyRow from '@kubewarden/components/Dashboard/EmptyRow.vue';

const store = useStore();
const { t } = useI18n(store);

defineProps<{
  protect: number;
  monitor: number;
  protectLink: object;
  monitorLink: object;
  createLink: object;
}>();
</script>

<template>
  <div class="policies-summary">
    <span class="policies-summary__title">{{ t('kubewarden.generic.policies') }}</span>
    <div class="policies-summary__stats">

      <!-- With policies -->
      <template v-if="protect > 0 || monitor > 0">
        <SubtleLink
          v-if="protect > 0"
          :to="protectLink"
        >{{ protect }} {{ t('kubewarden.dashboard.cards.generic.protect') }}</SubtleLink>
        <span v-else>{{ protect }} {{ t('kubewarden.dashboard.cards.generic.protect') }}</span>
        <span>+</span>
        <SubtleLink
          :to="monitorLink"
          v-if="monitor > 0"
        >{{ monitor }} {{ t('kubewarden.dashboard.cards.generic.monitor') }}</SubtleLink>
        <span v-else>{{ monitor }} {{ t('kubewarden.dashboard.cards.generic.monitor') }}</span>
      </template>

      <!-- No policies -->
      <template v-else>
        <EmptyRow
          :to="createLink"
          linkText="kubewarden.dashboard.cards.generic.policies.new"
          emptyText="kubewarden.dashboard.cards.generic.policies.empty"
        />
      </template>
    </div>
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
