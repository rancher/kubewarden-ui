<script>
export default {
  props:      {
    col: {
      type:    Object,
      default: () => {}
    },
    value: {
      type:     Array,
      default:  () => {
        return [];
      }
    }
  },

  created() {
    if (this.value) {
      const resourceToShow = this.value.flatMap((r) => r[this.col.name]);

      if (resourceToShow) {
        this.resourceToShow = [...new Set(resourceToShow)];
      }
    }
  },

  data() {
    return { resourceToShow: null };
  },

  computed: {
    resourceLabels() {
      if (this.resourceToShow?.length > 1) {
        const out = [];
        const last = this.resourceToShow[this.resourceToShow.length - 1];

        this.resourceToShow.forEach((resource) => {
          if (resource === last) {
            out.push(resource);
          } else {
            out.push(`${ resource }, `);
          }
        });

        return out;
      }

      return this.resourceToShow;
    },
  }
};
</script>

<template>
  <div>
    <span v-for="(resource, i) in resourceLabels" :key="i">
      {{ resource }}
    </span>
  </div>
</template>
