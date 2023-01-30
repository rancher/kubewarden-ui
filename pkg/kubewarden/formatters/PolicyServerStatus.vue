<script>
import isEmpty from 'lodash/isEmpty';
import { mapGetters } from 'vuex';

import { WORKLOAD_TYPES } from '@shell/config/types';

import { BadgeState } from '@components/BadgeState';
import { colorForPolicyServerState } from '../plugins/kubewarden-class';

export default {
  components: { BadgeState },

  props:      {
    value: {
      type:     String,
      required: true
    }
  },

  async fetch() {
    await this.$store.dispatch(`${ this.currentProduct.inStore }/findAll`, { type: WORKLOAD_TYPES.DEPLOYMENT });
  },

  computed: {
    ...mapGetters(['currentProduct']),

    allDeployments() {
      return this.$store.getters[`${ this.currentProduct.inStore }/all`](WORKLOAD_TYPES.DEPLOYMENT);
    },

    deployment() {
      if ( !isEmpty(this.allDeployments) ) {
        return this.allDeployments.find(d => d.spec.template.metadata.labels['kubewarden/policy-server'] === this.value);
      }

      return null;
    },

    stateBackground() {
      return `bg-${ colorForPolicyServerState(this.stateDisplay) }`;
    },

    stateDisplay() {
      if ( !isEmpty(this.deployment) ) {
        return this.deployment.metadata?.state?.name;
      }

      return 'pending';
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
      v-if="stateDisplay"
      :color="stateBackground"
      :label="capitalizeMessage(stateDisplay)"
    />
  </div>
</template>
