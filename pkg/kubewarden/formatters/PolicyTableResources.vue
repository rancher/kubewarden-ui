<script>
export default {
  props: {
    value: {
      type:     Object,
      required: true
    }
  },

  computed: {
    resources() {
      const resourceList = this.value?.['kubewarden/resources']?.split(',');

      if (Array.isArray(resourceList)) {
        if (resourceList.length > 1) {
          return 'Multiple';
        } else if (resourceList.length === 1) {
          if (resourceList[0] === '*') {
            return 'Global';
          }

          return resourceList[0];
        }
      }

      return undefined;
    }
  }
};
</script>

<template>
  <div>
    {{ resources }}
  </div>
</template>