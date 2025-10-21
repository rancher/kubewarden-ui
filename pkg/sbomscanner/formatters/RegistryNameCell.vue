<template>
  <RouterLink :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${ PAGE.REGISTRIES }/${ row.metadata.namespace }/${ row.metadata.name }`">
    {{ row.metadata.name }}
  </RouterLink>
</template>
<script>
import {
  PRODUCT_NAME,
  PAGE,
} from '@pkg/types';
export default {
  props: {
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
