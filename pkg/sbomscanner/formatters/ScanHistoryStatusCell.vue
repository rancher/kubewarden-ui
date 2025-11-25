<script>
import StatusBadge from '@sbomscanner/components/common/StatusBadge';
export default {
  components: { StatusBadge },
  props:      {
    value: {
      type:     String,
      required: true
    }
  },
};
</script>

<template>
  <StatusBadge :status="value.toLowerCase()" />
</template>
