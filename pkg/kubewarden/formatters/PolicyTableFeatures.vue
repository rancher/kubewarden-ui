<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  value: {
    type:     Object,
    required: true
  }
});

const features = computed<string | undefined>((): string | undefined => {
  const featuresList = [];

  if (props.value?.['kubewarden/mutation'] === 'true') {
    featuresList.push('Mutation');
  }

  if (props.value?.['kubewarden/contextAwareResources']) {
    featuresList.push('Context Aware');
  }

  return featuresList.length ? featuresList.join(', ') : undefined;
});
</script>

<template>
  <div v-if="features">
    {{ features }}
  </div>
</template>