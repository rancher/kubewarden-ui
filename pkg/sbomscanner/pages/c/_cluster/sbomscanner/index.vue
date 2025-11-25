<script>
import Dashboard from '@sbomscanner/pages/c/_cluster/sbomscanner/Dashboard';
import { SERVICE, SCHEMA } from '@shell/config/types';
import { RESOURCE } from '@sbomscanner/types';
import InstallView from '@sbomscanner/components/InstallView';

export default {
  name: 'InstallationWizard',

  components: { Dashboard, InstallView },

  async fetch() {
    if ( this.$store.getters['cluster/canList'](SERVICE) ) {
      this.allServices = await this.$store.dispatch('cluster/findAll', { type: SERVICE }, { root: true });
    }
    if ( this.$store.getters['cluster/canList'](SCHEMA) ) {
      this.allSchemas = await this.$store.dispatch('cluster/findAll', { type: SCHEMA }, { root: true });
    }
  },

  data() {
    return {
      allServices: null,
      allSchemas:  null,
      index:       -1,
      store:       this.$store,
    };
  },

  computed: {
    hasSchema() {
      return this.$store.getters['cluster/schemaFor'](RESOURCE.REGISTRY);
    },
  }
};
</script>

<template>
  <div v-if="allSchemas">
    <InstallView
      v-if="!hasSchema"
    />
    <Dashboard v-else />
  </div>
</template>
