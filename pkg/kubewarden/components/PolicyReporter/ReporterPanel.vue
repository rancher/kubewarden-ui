<script setup lang="ts">
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { ClusterPolicyReport, PolicyReport } from '../../types';
import { getReports } from '../../modules/policyReporter';

const store = useStore();
const route = useRoute();

/**
 * Invisible panel to fetch PolicyReports for ResourceList
 * views. Instead of running a fetch on each resource within
 * the list we can fetch once at the top of the page and
 * store the reports.
 */
onMounted(
  async () => {
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
);
</script>

<template>
  <div class="reporter-panel">
  </div>
</template>

<style lang="scss" scoped>
.reporter-panel {
  display: none;
}
</style>