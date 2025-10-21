<script>
import {
  PRODUCT_NAME,
  PAGE,
} from '@pkg/types';
export default {
  name:  'CveNameLink',
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
  <RouterLink :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${PAGE.VULNERABILITIES}/${value}`">
    {{ value }}
  </RouterLink>
</template>
