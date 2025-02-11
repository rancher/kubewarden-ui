<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';

import { WORKLOAD_TYPES } from '@shell/config/types';

import { BadgeState } from '@components/BadgeState';

import { Deployment } from '../types';
import { colorForPolicyServerState } from '../plugins/kubewarden-class';

const props = defineProps<{
  value: string;
}>();

const store = useStore();
const value = ref<string>(props.value);
const isLoading = ref<boolean>(false);

const allDeployments = computed<Deployment[]>(() => store.getters['cluster/all'](WORKLOAD_TYPES.DEPLOYMENT));

// Accumulate deployments by their label for faster filtering
const deploymentsByLabel = computed(() => {
  return allDeployments.value.reduce((acc, deployment) => {
    const label = deployment?.spec?.template?.metadata?.labels?.['kubewarden/policy-server'];

    if (label) {
      acc[label] = deployment;
    }

    return acc;
  }, {} as Record<string, Deployment>);
});

const deployment = computed(() => {
  const label = value.value;

  return deploymentsByLabel.value[label] || null;
});

const stateDisplay = computed(() => {
  if (deployment.value) {
    return deployment.value?.metadata?.state?.name;
  }

  return 'pending';
});

const stateBackground = computed(() => `bg-${ colorForPolicyServerState(stateDisplay.value) }`);

const capitalizeMessage = (m: string) => m?.charAt(0).toUpperCase() + m?.slice(1);

onMounted(async () => {
  isLoading.value = true;

  if (store.getters['cluster/canList'](WORKLOAD_TYPES.DEPLOYMENT)) {
    await store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.DEPLOYMENT });
    
  }

  isLoading.value = false;
});
</script>

<template>
  <div>
    <div v-if="isLoading">
      <i class="icon icon-lg icon-spinner icon-spin" />
    </div>
    <BadgeState
      v-else-if="stateDisplay"
      :color="stateBackground"
      :label="capitalizeMessage(stateDisplay)"
    />
    <div v-else>
      <BadgeState
        color="bg-warning"
        label="Pending"
      />
    </div>
  </div>
</template>
