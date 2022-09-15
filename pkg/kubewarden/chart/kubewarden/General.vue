<script>
import { _CREATE } from '@shell/config/query-params';

import NameNsDescription from '@shell/components/form/NameNsDescription';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      required: true
    }
  },

  components: {
    LabeledInput, NameNsDescription, RadioGroup
  },

  data() {
    return {
      defaultImage:          true,
      defaultServiceAccount: this.value?.spec?.serviceAccountName || null,
    };
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    }
  }
};
</script>

<template>
  <div>
    <div class="row mt-10">
      <div class="col span-12">
        <NameNsDescription
          :mode="mode"
          :value="value"
          :namespaced="false"
          :description-hidden="true"
          name-key="nameOverride"
        />
      </div>
    </div>
  </div>
</template>
