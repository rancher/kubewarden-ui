<script>
export default {
  name:  'UriExternalLink',
  props: {
    value: {
      type:     String,
      required: true
    },
    row: {
      type:    Object,
      default: () => ({})
    }
  }
};
</script>

<template>
  <a
    class="uri-link"
    :href="value"
    target="_blank"
    rel="noopener noreferrer"
  >
    {{ value }}
    <i class="icon icon-external-link"></i>
  </a>
</template>

<style lang="scss" scoped>
  .uri-link {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
