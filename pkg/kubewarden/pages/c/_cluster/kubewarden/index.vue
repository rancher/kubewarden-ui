<script>
import { KUBEWARDEN } from '../../../../types';

import DashboardView from '../../../../components/Dashboard/DashboardView';
import InstallView from '../../../../components/Dashboard/InstallView';

export default {
  name: 'Dashboard',

  components: { DashboardView, InstallView },

  computed: {
    hasSchema() {
      return this.$store.getters['cluster/schemaFor'](KUBEWARDEN.POLICY_SERVER);
    }
  }
};
</script>

<template>
  <InstallView v-if="!hasSchema" :has-schema="hasSchema" />
  <DashboardView v-else />
</template>
