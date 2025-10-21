<template>
  <div :class="isGrid ? 'rancher-meta' : ''">
    <RancherMetaProperty
      v-for="(property, index) in properties"
      :key="index"
      :property="property"
    />
  </div>
</template>

<script>
import RancherMetaProperty from './RancherMetaProperty.vue';

export default {
  name:       'RancherMeta',
  components: { RancherMetaProperty },
  props:      {
    properties: {
      type:    Array,
      default: () => []
    },
    isGrid: {
      type:    Boolean,
      default: () => {
        return true;
      },
    }
  },
};
</script>

<style lang="scss" scoped>
  .rancher-meta {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: flex-start;
    row-gap: 4px;
    column-gap: 24px;
    align-self: stretch;
  }
</style>
