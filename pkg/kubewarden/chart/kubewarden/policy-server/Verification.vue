<script>
import isEmpty from 'lodash/isEmpty';

import { _CREATE } from '@shell/config/query-params';
import { randomStr } from '@shell/utils/string';

import { Banner } from '@components/Banner';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      default:  null
    },

    configMaps: {
      type:     Array,
      required: true
    }
  },

  components: { Banner, LabeledSelect },

  data() {
    return { vConfig: this.value.verificationConfig };
  },

  computed: {
    options() {
      if ( !isEmpty(this.configMaps) ) {
        return this.configMaps.map(config => config.id);
      }

      return [];
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <Banner
        v-clean-html="t('kubewarden.policyServerConfig.verification.description', {}, true)"
        data-testid="ps-config-verification-banner"
        class="type-banner mb-20 mt-0"
        color="info"
      />
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.verificationConfig"
          data-testid="ps-config-verification-select"
          :mode="mode"
          :label="t('kubewarden.policyServerConfig.verification.label')"
          :options="options"
        />
      </div>
    </div>
  </div>
</template>
