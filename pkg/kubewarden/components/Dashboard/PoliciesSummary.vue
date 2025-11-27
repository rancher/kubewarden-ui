<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

const store = useStore();
const { t } = useI18n(store);

defineProps<{
  protect: number;
  monitor: number;
}>();
</script>

<template>
  <p>{{ t('kubewarden.generic.policies') }} {{ protect }} {{ t('kubewarden.generic.protect') }} + {{ monitor }} {{ t('kubewarden.generic.monitor') }}</p>
</template>
