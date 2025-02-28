<script setup lang="ts">
import { computed } from 'vue';

import { KUBEWARDEN_POLICY_ANNOTATIONS, LEGACY_POLICY_ANNOTATIONS } from '../types';

const props = defineProps({
  value: {
    type:     Object,
    required: true
  }
});

const resources = computed<string | undefined>((): string | undefined => {
  const annotation = props.value?.[KUBEWARDEN_POLICY_ANNOTATIONS.RESOURCES] ??
                     props.value?.[LEGACY_POLICY_ANNOTATIONS.RESOURCES];

  const resourceList = annotation?.split(',');

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