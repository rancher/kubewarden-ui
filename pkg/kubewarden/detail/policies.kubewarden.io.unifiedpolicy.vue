<script setup lang="ts">
import type SteveModel from '@shell/plugins/steve/steve-class';

import UnifiedPolicyDetail from '@kubewarden/components/UnifiedPolicy/UnifiedPolicyDetail.vue';

const props = defineProps<{
  value: SteveModel;
  mode: string;
}>();
</script>

<template>
  <UnifiedPolicyDetail :resource="props.value" :mode="props.mode" />
</template>
