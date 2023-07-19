<script>
import { BadgeState } from '@components/BadgeState';

import { MODE_MAP } from '../types';

export default {
  components: { BadgeState },

  props:      {
    value: {
      type:     String,
      default: ''
    }
  },

  data() {
    return { MODE_MAP };
  },

  computed: {
    capitalizedMode() {
      return this.value?.charAt(0).toUpperCase() + this.value?.slice(1);
    },

    modeColor() {
      return this.MODE_MAP[this.value];
    }
  }
};
</script>

<template>
  <div>
    <BadgeState
      v-if="value"
      :color="modeColor"
      :label="capitalizedMode"
    />
  </div>
</template>
