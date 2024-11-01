<script>
import { _CREATE } from '@shell/config/query-params';

import { KUBEWARDEN } from '../types';

import PolicyDetail from '../components/Policies/PolicyDetail';

export default {
  name: 'ClusterAdmissionPolicy',

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },
    value: {
      type:     Object,
      required: true,
    },
  },

  components: { PolicyDetail },

  data() {
    return {
      resource: KUBEWARDEN.CLUSTER_ADMISSION_POLICY
    }
  }
};
</script>

<template>
  <PolicyDetail :value="value" :mode="mode" :resource="resource" />
</template>
