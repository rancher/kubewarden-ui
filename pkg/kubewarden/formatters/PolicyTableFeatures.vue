<script>
export default {
  props: {
    value: {
      type:     Object,
      required: true
    }
  },

  computed: {
    features() {
      const featuresList = [];

      if (this.value?.['kubewarden/mutation'] === 'true') {
        featuresList.push('Mutation');
      }

      if (this.value?.['kubewarden/contextAwareResources']) {
        featuresList.push('Context Aware');
      }

      return featuresList.length ? featuresList.join(', ') : undefined;
    }
  }
};
</script>

<template>
  <div>
    {{ features }}
  </div>
</template>