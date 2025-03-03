<script setup lang="ts">
import { onMounted, getCurrentInstance, nextTick } from 'vue';
import { useStore } from 'vuex';
import { RouteLocationNormalizedLoaded } from 'vue-router';

import { ClusterPolicyReport, PolicyReport } from '@kubewarden/types';
import { getReports } from '@kubewarden/modules/policyReporter';

/**
 * Invisible panel to fetch PolicyReports for ResourceList
 * views. Instead of running a fetch on each resource within
 * the list we can fetch once at the top of the page and
 * store the reports.
 */

const store = useStore();

let route: RouteLocationNormalizedLoaded | null = null;

async function fetchPolicies() {
  const isClusterLevel = !route?.params?.resource || route?.path?.includes('projectsnamespaces');
  const resourceType = route?.params?.resource as string | undefined;

  // Fetch cluster level reports if no specific resource is specified
  if (isClusterLevel) {
    await getReports<ClusterPolicyReport>(store, true);
  }
  // Fetch normal policy reports if a specific resource type is specified or always fetch on projectsnamespaces page
  if (resourceType || route?.path?.includes('projectsnamespaces')) {
    await getReports<PolicyReport>(store, false, resourceType);
  }
}

onMounted(async() => {
  store.commit('kubewarden/updateLoadingReports', true);
  if (!route) {
    const instance = getCurrentInstance();

    if (instance?.proxy?.$route) {
      route = instance.proxy.$route;
    } else {
      return;
    }
  }

  await nextTick();
  await fetchPolicies();

  store.commit('kubewarden/updateLoadingReports', false);
});
</script>

<template>
  <div class="reporter-panel"></div>
</template>

<style lang="scss" scoped>
.reporter-panel {
  display: none;
}
</style>
