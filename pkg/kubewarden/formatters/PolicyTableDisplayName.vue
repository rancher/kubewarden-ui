<script setup lang="ts">
import { computed } from 'vue';

import { KUBEWARDEN_POLICY_ANNOTATIONS, LEGACY_POLICY_ANNOTATIONS, PolicyChart } from '@kubewarden/types';

const props = defineProps<{ row: PolicyChart }>();

const displayName = computed<string>(() => {
  const { annotations } = props.row;
  let name = props?.row?.name;

  if (annotations) {
    name =
      annotations[KUBEWARDEN_POLICY_ANNOTATIONS.DISPLAY_NAME] ??
      annotations[LEGACY_POLICY_ANNOTATIONS.DISPLAY_NAME] ??
      name;
  }

  return name;
});
const isOfficial = computed<boolean>((): boolean => props.row?.official || false);
</script>

<template>
  <div v-if="displayName" class="name-badge">
    {{ displayName }}
    <span v-if="isOfficial" class="name-badge__icon">
      <img
        v-clean-tooltip="t('kubewarden.policies.official')"
        src="../assets/icon-kubewarden.svg"
        :alt="t('kubewarden.policies.official')"
        class="ml-5"
      >
    </span>
  </div>
</template>

<style lang="scss" scoped>
.name-badge {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-content: center;

  &__icon {
    display: flex;
    align-items: center;
    width: 20px;
    height: auto;

    & img {
      width: 100%;
    }
  }
}
</style>
