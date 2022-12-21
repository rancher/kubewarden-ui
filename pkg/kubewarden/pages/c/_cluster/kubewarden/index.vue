<script>
import Loading from '@shell/components/Loading';

import { KUBEWARDEN } from '../../../../types';

import DashboardView from '../../../../components/Dashboard/DashboardView';
import InstallView from '../../../../components/Dashboard/InstallView';

export default {
  name: 'Dashboard',

  components: {
    DashboardView,
    InstallView,
    Loading,
  },

  fetch() {
    this.hasSchema = this.$store.getters['cluster/schemaFor'](KUBEWARDEN.POLICY_SERVER);
  },

  data() {
    return { hasSchema: null };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <InstallView v-if="!hasSchema" :has-schema="hasSchema" />
    <DashboardView />
  </div>
</template>
