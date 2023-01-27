<script>
import isEmpty from 'lodash/isEmpty';

import { BadgeState } from '@components/BadgeState';
import { colorForPolicyServerState } from '../plugins/kubewarden-class';

export default {
  components: { BadgeState },

  props:      {
    value: {
      type:     Promise,
      required: true
    }
  },

  async fetch() {
    const deployment = await this.value;

    if ( !isEmpty(deployment) ) {
      this.stateDisplay = deployment.map(d => d.metadata.state.name)[0];

      const color = colorForPolicyServerState(this.stateDisplay);

      this.stateBackground = `bg-${ color }`;
    }
  },

  data() {
    return {
      stateDisplay:    '',
      stateBackground: ''
    };
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
      v-if="stateDisplay"
      :color="stateBackground"
      :label="capitalizeMessage(stateDisplay)"
    />
  </div>
</template>
