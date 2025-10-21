<template>
  <div>
    <ResourceTable
      ref="rt"
      :schema="schema"
      :rows="rows"
      :namespaced="false"
      :headers="headers"
      :key-field="'id'"
      :table-actions="true"
      :use-query-params-for-simple-filtering="true"
      :force-update-live-and-delayed="forceUpdateKey"
    >
    </ResourceTable>
  </div>
</template>

<script>
import {
  RESOURCE,
  PRODUCT_NAME,
} from '@pkg/types';
import ResourceTable from '@shell/components/ResourceTable';
import { VEX_MANAGEMENT_TABLE } from '@pkg/config/table-headers';

export default {
  name:       'VexManagement',
  components: { ResourceTable },
  data() {
    return {
      PRODUCT_NAME,
      headers:        VEX_MANAGEMENT_TABLE,
      disabled:       false,
      selectedRows:   [],
      filterText:     '',
      rows:           [],
      forceUpdateKey: 0,
    };
  },
  async fetch() {
    await this.$store.dispatch('cluster/findAll', { type: RESOURCE.VEX_HUB });
    const vexhubsCRD = this.$store.getters['cluster/all']?.(RESOURCE.VEX_HUB);

    this.rows = vexhubsCRD || [];
  },
  methods: {
    rowWithActions(r) {
      return r;
    },
    async switchStatus(desired, selected) {
      const resources = selected && selected.length ? selected : (this.selectedRows || []);

      if (!resources.length) return;
      await Promise.all(resources.map(async(m) => {
        m.spec = { ...(m.spec || {}), enabled: desired };
        await m.save();
      }));
      await this.$fetch();
    }
  },
  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor']?.(RESOURCE.VEX_HUB);
    }
  }
};
</script>

<style lang="scss" scoped>
</style>
