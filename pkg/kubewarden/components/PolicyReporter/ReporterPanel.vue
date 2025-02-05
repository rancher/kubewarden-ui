<script>
import { getReports } from '../../modules/policyReporter';

/**
 * Invisible panel to fetch PolicyReports for ResourceList
 * views. Instead of running a fetch on each resource within
 * the list we can fetch once at the top of the page and
 * store the reports.
 */
export default {
  async fetch() {
    const isClusterLevel = !this.$route.params.resource;
    const resourceType = this.$route.params.resource;

    // Fetch cluster level reports if no specific resource is specified
    if (isClusterLevel) {
      await getReports(this.$store, true);
    }
    // Fetch normal policy reports if a specific resource type is specified or always fetch on projectsnamespaces page
    if (resourceType || this.$route.path.includes('projectsnamespaces')) {
      await getReports(this.$store, false, resourceType);
    }
  }
};
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