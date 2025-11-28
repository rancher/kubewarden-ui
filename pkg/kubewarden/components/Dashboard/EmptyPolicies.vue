<script setup lang="ts">
import { RcButton } from '@rancher/components';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';

const store = useStore();
const { t } = useI18n(store);

defineProps<{
  label: string;
  to: string | object;
}>();
</script>

<template>
  <div>
    <p>{{ label }}</p>
    <VerticalGap />
    <router-link :to="to">
      <RcButton link >{{ t('kubewarden.dashboard.cards.generic.new') }}</RcButton>
    </router-link>
  </div>
</template>
