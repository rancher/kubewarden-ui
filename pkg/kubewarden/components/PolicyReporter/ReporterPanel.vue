<script>
import { getPolicyReports } from '../../modules/policyReporter';

/**
 * Invisible panel to fetch PolicyReports for ResourceList
 * views. Instead of running a fetch on each resource within
 * the list we can fetch once at the top of the page and
 * store the reports.
 */
export default {
  async fetch() {
    await getPolicyReports(this.$store);
  },
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