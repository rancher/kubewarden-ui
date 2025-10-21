<script>
import DetailPage from '@rancher/shell/components/Resource/Detail/Page.vue';
import RegistryDetailScanTable from '@pkg/components/RegistryDetailScanTable.vue';

export default {
  name:  'CruRegistry',
  props: {
    value: {
      type:     Object,
      required: true
    }
  },
  data() {
    return {};
  },
  components: {
    DetailPage,
    RegistryDetailScanTable,
  },
};
</script>

<template>
  <DetailPage>
    <template #bottom-area>
      <RegistryDetailScanTable :registry="value" />
    </template>
  </DetailPage>
</template>
