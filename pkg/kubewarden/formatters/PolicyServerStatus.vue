<script>
import isEmpty from 'lodash/isEmpty';

import { WORKLOAD_TYPES } from '@shell/config/types';

import { BadgeState } from '@components/BadgeState';
import { colorForPolicyServerState } from '@kubewarden/plugins/kubewarden-class';

export default {
  components: { BadgeState },

  props:      {
    value: {
      type:     String,
      required: true
    }
  },

  async created() {
    if (this.$store.getters['cluster/canList'](WORKLOAD_TYPES.DEPLOYMENT)) {
      await this.$store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.DEPLOYMENT });
    }
  },

  computed: {

    allDeployments() {
      return this.$store.getters['cluster/all'](WORKLOAD_TYPES.DEPLOYMENT);
    },

    deployment() {
      if (!isEmpty(this.allDeployments)) {
        return this.allDeployments.find((d) => d.spec.template.metadata.labels['kubewarden/policy-server'] === this.value);
      }

      return null;
    },

    stateBackground() {
      return `bg-${ colorForPolicyServerState(this.stateDisplay) }`;
    },

    stateDisplay() {
      if (!isEmpty(this.deployment)) {
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
