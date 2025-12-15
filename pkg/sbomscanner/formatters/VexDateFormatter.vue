<template>
  <span>{{ formattedDate }}</span>
</template>

<script>
export default {
  name:  'VexDateFormatter',
  props: {
    value: {
      type:     [String, Date],
      required: true
    },
    row: {
      type:    Object,
      default: () => ({})
    }
  },
  computed: {
    formattedDate() {
      const date = new Date(this.value);
      const options = {
        month:  'short',
        day:    'numeric',
        year:   'numeric',
        hour:   'numeric',
        minute: '2-digit',
        hour12: true
      };

      return date.toLocaleString('en-US', options);
    }
  }
};
</script>
