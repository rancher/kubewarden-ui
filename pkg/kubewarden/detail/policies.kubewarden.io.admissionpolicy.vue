<script>
import { _CREATE } from '@shell/config/query-params';

import PolicyDetail from '../components/Policies/PolicyDetail';

export default {
  name: 'AdmissionPolicy',

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },

    resource: {
      type:    String,
      default: null
    },

    value: {
      type:     Object,
      required: true,
    },
  },

  components: { PolicyDetail }
};
</script>

<template>
  <PolicyDetail :value="value" :mode="mode" :resource="resource" />
</template>
