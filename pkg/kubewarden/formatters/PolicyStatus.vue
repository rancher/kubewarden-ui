<script>
import { BadgeState } from '@components/BadgeState';

import { colorForStatus } from '../plugins/kubewarden/policy-class';

export default {
  components: { BadgeState },

  props:      {
    value: {
      type:     String,
      default: ''
    }
  },

  data() {
    return {
      stateDisplay:    '',
      stateBackground: ''
    };
  },

  watch: {
    value: {
      handler() {
        const color = colorForStatus(this.value);

        this.stateDisplay = this.value;
        this.stateBackground = color.replace('text-', 'bg-');
      },

      immediate: true
    }
  },

  methods: {
    capitalizeMessage(m) {
      return m?.charAt(0).toUpperCase() + m?.slice(1);
    },
  }
};
</script>

<template>
  <div>
    <BadgeState
      v-if="value"
      :color="stateBackground"
      :label="capitalizeMessage(stateDisplay)"
    />
  </div>
</template>
