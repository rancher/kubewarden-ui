<script>
import { REGISTRY_SCAN_HISTORY_TABLE } from '@pkg/config/table-headers';
import SortableTable from '@shell/components/SortableTable';

export default {
  name:       'RegistryDetailScanTable',
  components: { SortableTable },
  props:      {
    scanHistory: {
      type:     Array,
      required: true
    }
  },
  data() {
    return { headers: REGISTRY_SCAN_HISTORY_TABLE };
  }
};
</script>

<template>
  <div class="registry-detail-scan-table">
    Recent scans
    <SortableTable
      :has-advanced-filtering="false"
      :namespaced="false"
      :row-actions="false"
      :table-actions="false"
      :sub-rows-description="false"
      :search="false"
      :headers="headers"
      :rows="scanHistory"
      :default-sort-by="'since'"
    />
  </div>
</template>

<style lang="scss" scoped>
  .registry-detail-scan-table {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
  }
</style>
