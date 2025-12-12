<script>
import {
  PRODUCT_NAME,
  PAGE,
} from '@sbomscanner/types';
export default {
  name:  'RegistryCellLink',
  props: {
    value: {
      type:     String,
      required: true
    },
    row: {
      type:     Object,
      required: true
    }
  },
  data() {
    return {
      PRODUCT_NAME,
      PAGE,
    };
  }
};
</script>

<template>
  <RouterLink :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${PAGE.REGISTRIES}/${row.metadata.namespace}/${value}`">
    {{ `${row.metadata.namespace}/${value}` }}
  </RouterLink>
</template>
