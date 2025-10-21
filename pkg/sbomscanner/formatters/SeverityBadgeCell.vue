<template>
  <span>{{ t(`imageScanner.enum.cve.${row.severity}`) }}</span>
</template>

<script>
export default {
  props: {
    row: {
      type:     Object,
      required: true
    }
  }
};
</script>
