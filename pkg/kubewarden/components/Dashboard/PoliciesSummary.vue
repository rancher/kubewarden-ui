<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import SubtleLink from '@shell/components/SubtleLink.vue';

const store = useStore();
const { t } = useI18n(store);

defineProps<{
  protect: number;
  monitor: number;
  protectLink: object;
  monitorLink: object;
}>();
</script>

<template>
  <div class="policies-summary">
    <span>{{ t('kubewarden.generic.policies') }}</span>
    <div class="policies-summary__stats">
      <SubtleLink
        v-if="protect > 0"
        :to="protectLink"
      >{{ protect }} {{ t('kubewarden.generic.protect') }}</SubtleLink>
      <span v-else>{{ protect }} {{ t('kubewarden.generic.protect') }}</span>
      <span>+</span>
      <SubtleLink
        :to="monitorLink"
        v-if="monitor > 0"
      >{{ monitor }} {{ t('kubewarden.generic.monitor') }}</SubtleLink>
      <span v-else>{{ monitor }} {{ t('kubewarden.generic.monitor') }}</span>
    </div>
  </div>
</template>
<style scoped lang="scss">
.policies-summary {
  display: flex;
  justify-content: space-between;
  width: 100%;

  &__stats {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
}
</style>
