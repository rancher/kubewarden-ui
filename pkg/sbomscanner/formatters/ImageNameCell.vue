<template>
  <RouterLink :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${ PAGE.IMAGES }/${ row.metadata.name }`">
    {{ displayName }}
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
  computed: {
    displayName() {
      return `${ this.row.imageMetadata?.registryURI }/${ this.row.imageMetadata?.repository }:${ this.row.imageMetadata?.tag }`;
    }
  }
};
</script>
