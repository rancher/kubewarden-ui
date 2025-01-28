<script setup lang="ts">
import { ref } from 'vue';
import { KUBEWARDEN_PRODUCT_NAME } from '../types';

const props = defineProps<{
  row: {
    repository: {
      organization_name: string;
    };
    signed: boolean;
    signatures: string[];
  };
}>();

const isOfficial = ref(props.row?.repository?.organization_name?.toLowerCase() === KUBEWARDEN_PRODUCT_NAME);
const subtypeSignature = ref(props.row?.signatures?.[0] || 'unknown');
</script>

<template>
  <div class="badge">
    <div v-if="row.signed" class="badge__signed">
      <span v-clean-tooltip="t('kubewarden.policyCharts.signedPolicy.tooltip', { signatures: subtypeSignature })">
        <i class="icon icon-lock" />
      </span>
    </div>

    <div v-if="isOfficial" class="badge__icon">
      <img
        v-clean-tooltip="t('kubewarden.policies.official')"
        src="../assets/icon-kubewarden.svg"
        :alt="t('kubewarden.policies.official')"
        class="ml-5"
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.badge {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-content: center;

  &__icon {
    width: 20px;
  }
}
</style>