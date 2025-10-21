<script>
import {
  PRODUCT_NAME,
  PAGE,
} from '@pkg/types';
export default {
  name:  'VexNameLink',
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
  },
};
</script>

<template>
  <RouterLink :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${ PAGE.VEX_MANAGEMENT }/${row.id}`">
    {{ value }}
  </RouterLink>
</template>
