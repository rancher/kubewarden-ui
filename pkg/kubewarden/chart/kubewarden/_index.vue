<script>
import { _CREATE } from '@shell/config/query-params';

import { Checkbox } from '@components/Form/Checkbox';

export default {
  props: {
    chart: {
      type:    Object,
      default: () => ({}),
    },
    mode: {
      type:    String,
      default: _CREATE,
    },
    value: {
      type:    Object,
      default: () => ({}),
    },
  },

  components: { Checkbox }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <Checkbox
        v-model="value['kubewarden-defaults'].recommendedPolicies.enabled"
        label="Enable the Recommended Policies"
        tooltip="The chart allows the user to install some recommended policies to enforce some best practice security checks."
      />
    </div>
  </div>
</template>
