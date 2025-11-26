<template>
  <span>
    {{ value.split(':')[1].slice(0, 12) }}...
  </span>
</template>

<script>
export default {
  props: {
    value: {
      type:     String,
      required: true
    }
  }
};
</script>
