<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import SubtleLink from '@shell/components/SubtleLink.vue';

const store = useStore();
const { t } = useI18n(store);

defineProps<{
  to: object;
  emptyText: string;
  linkText: string;
}>();
</script>

<template>
  <div class="empty-row">
    <span class="empty-row__text">{{ t(emptyText) }}</span>
    <SubtleLink
      :to="to"
    >{{ t(linkText) }}</SubtleLink>
  </div>
</template>

<style lang="scss" scoped>

.empty-row {
  display: flex;
  width: 100%;
  gap: 0.5rem;

  &__text {
    display: flex;
    align-items: center;
    color: var(--disabled-text);
  }
}
</style>
