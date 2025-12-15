<script>
import Date from '@shell/components/formatter/Date';
export default {
  components: { Date },
  props:      {
    value: {
      type:     String,
      required: true
    }
  },
};
</script>

<template>
  <Date :value="value" />
</template>
