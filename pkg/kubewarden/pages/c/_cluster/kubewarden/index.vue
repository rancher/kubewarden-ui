<script>
import { KUBEWARDEN } from '../../../../types';
import { isAirgap } from '../../../../utils/determine-airgap';

import DashboardView from '../../../../components/Dashboard/DashboardView';
import InstallView from '../../../../components/Dashboard/InstallView';

export default {
  name: 'Dashboard',

  components: { DashboardView, InstallView },

  async fetch() {
    this.isAirgap = await isAirgap({ store: this.$store });
  },

  data() {
    return { isAirgap: null };
  },

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
