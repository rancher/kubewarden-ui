<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

const store = useStore();
const { t } = useI18n(store);

defineProps<{
  protect: number;
  monitor: number;
  link: string;
}>();
</script>

<template>
  <div class="policies-summary">
    <span>{{ t('kubewarden.generic.policies') }}</span>
    <div class="policies-summary__stats">
      <span>{{ protect }} {{ t('kubewarden.generic.protect') }}</span>
      <span>+</span>
      <router-link
        :to="link"
      >{{ monitor }} {{ t('kubewarden.generic.monitor') }}</router-link>
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
