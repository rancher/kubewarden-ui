<script>
import { _CREATE } from '@shell/config/query-params';

import { KUBEWARDEN } from '../types';

import PolicyDetail from '../components/Policies/PolicyDetail';

export default {
  name: 'AdmissionPolicy',

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
      resource: KUBEWARDEN.ADMISSION_POLICY
    }
  }
};
</script>

<template>
  <PolicyDetail :value="value" :mode="mode" :resource="resource" />
</template>
