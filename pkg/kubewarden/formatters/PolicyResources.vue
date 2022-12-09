<script>
import isEmpty from 'lodash/isEmpty';

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

  fetch() {
    if ( this.value ) {
      const resourceToShow = this.value.flatMap(r => r[this.col.name]);

      if ( resourceToShow ) {
        this.resourceToShow = [...new Set(resourceToShow)];
      }
    }
  },

  data() {
    return { resourceToShow: null };
  },

  computed: {
    mainResource() {
      if ( !isEmpty(this.resourceToShow) ) {
        return this.resourceToShow[0];
      }

      return '-';
    },

    resourceLabels() {
      if ( this.resourceToShow.length > 1 ) {
        let out = '';

        this.resourceToShow.forEach((resource) => {
          out += `&#8226; ${ resource }<br>`;
        });

        return out;
      }

      return null;
    },
  }
};
</script>

<template>
  <div>
    <span>{{ mainResource }}</span>
    <br>
    <span
      v-if="resourceToShow.length - 1 > 0"
      v-tooltip.bottom="resourceLabels"
      class="plus-more"
    >
      {{ t('generic.plusMore', { n: resourceToShow.length - 1 }) }}
    </span>
  </div>
</template>
