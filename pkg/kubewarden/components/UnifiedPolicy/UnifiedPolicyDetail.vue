<script setup lang="ts">
import { computed } from 'vue';

import { KUBEWARDEN } from '@kubewarden/constants';

import PolicyDetail from '@kubewarden/components/Policies/PolicyDetail.vue';
import PolicyGroupDetail from '@kubewarden/components/Policies/PolicyGroupDetail.vue';

const props = defineProps<{
  resource: object;
  mode: string;
}>();

const isGroup = computed(() => {
  return [
    KUBEWARDEN.CLUSTER_ADMISSION_POLICY_GROUP,
    KUBEWARDEN.ADMISSION_POLICY_GROUP
  ].includes(props.resource?.type);
});

</script>

<template>
  <div>
    <component
      :is="isGroup ? PolicyGroupDetail : PolicyDetail"
      :value="props.resource"
      :resource="props.resource?.type"
      :mode="props.mode" />
  </div>
</template>
