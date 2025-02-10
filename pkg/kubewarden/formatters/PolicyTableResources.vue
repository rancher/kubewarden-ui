<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  value: {
    type:     Object,
    required: true
  }
});

const resources = computed<string | undefined>((): string | undefined => {
  const resourceList = props.value?.['kubewarden/resources']?.split(',');

  if (Array.isArray(resourceList)) {
    if (resourceList.length > 1) {
      return 'Multiple';
    } else if (resourceList.length === 1) {
      if (resourceList[0] === '*') {
        return 'Global';
      }

      return resourceList[0];
    }
  }

  return undefined;
});
</script>

<template>
  <div v-if="resources">
    {{ resources }}
  </div>
</template>