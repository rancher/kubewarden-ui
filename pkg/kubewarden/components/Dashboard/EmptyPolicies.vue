<script setup lang="ts">
import { RcButton } from '@rancher/components';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

const store = useStore();
const { t } = useI18n(store);

defineProps<{
  label: string;
}>();
</script>

<template>
  <div>
    <p>{{ label }}</p>
    <RcButton link>{{ t('kubewarden.dashboard.cards.generic.new') }}</RcButton>
  </div>
</template>
