<template>
  <RouterLink :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${ PAGE.IMAGES }/${ row.metadata.name }`">
    {{ displayName }}
  </RouterLink>
</template>
<script>
import {
  PRODUCT_NAME,
  PAGE,
} from '@sbomscanner/types';
import { constructImageName } from '@sbomscanner/utils/image';
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
      return this.row.imageReference ? this.row.imageReference : constructImageName(this.row.imageMetadata);
    }
  }
};
</script>
