<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';

import { BadgeState } from '@components/BadgeState';

import { colorForStatus } from '../plugins/kubewarden-class';

const props = defineProps<{
  value: string;
}>();

const stateDisplay = ref('');
const stateBackground = ref('');

const capitalizeMessage = (m: string) => {
  return m?.charAt(0).toUpperCase() + m?.slice(1);
};

watch(() => props.value, () => {
  const color = colorForStatus(props.value) || 'text-info';

  stateDisplay.value = props.value || 'unknown';
  stateBackground.value = color.replace('text-', 'bg-');

}, { immediate: true });

onUnmounted(() => {
  stateDisplay.value = '';
  stateBackground.value = '';
});
</script>

<template>
  <div>
    <BadgeState
      :color="stateBackground"
      :label="capitalizeMessage(stateDisplay)"
    />
  </div>
</template>
