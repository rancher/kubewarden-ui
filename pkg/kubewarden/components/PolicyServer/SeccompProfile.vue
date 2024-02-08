<script>
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      required: true
    },

    configType: {
      type:    String,
      default: 'container'
    },

    disabled: {
      type:     Boolean,
      default: false
    }
  },

  components: {
    Loading,
    LabeledInput,
    LabeledSelect,
  },

  async fetch() {},

  data() {
    return {
      localhostProfile:          this.value.localhostProfile,
      type:                      this.value.type,
      seccompProfileTypeOptions: ['Localhost', 'RuntimeDefault', 'Unconfined']
    };
  },
  methods: {
    updateData() {
      this.$emit('update-seccomp-profile', {
        localhostProfile: this.localhostProfile,
        type:             this.type,
      });
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <!-- SECCOMP PROFILE -->
    <div class="row mb-10">
      <div class="col span-6">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.seccompProfile.title') }}
        </h4>
        <LabeledInput
          v-model="localhostProfile"
          :data-testid="`ps-config-security-context-container-${configType}-seccompProfile-localhostProfile-input`"
          :mode="mode"
          :disabled="disabled"
          :label="t('kubewarden.policyServerConfig.securityContexts.seccompProfile.localhostProfile.label')"
          :placeholder="t('kubewarden.policyServerConfig.securityContexts.seccompProfile.localhostProfile.placeholder')"
          @input="updateData"
        />
      </div>
    </div>
    <div class="row mb-40">
      <div class="col span-6">
        <LabeledSelect
          v-model="type"
          :data-testid="`ps-config-security-context-container-${configType}-seccompProfile-type-input`"
          :mode="mode"
          :options="seccompProfileTypeOptions"
          :disabled="disabled"
          :label="t('kubewarden.policyServerConfig.securityContexts.seccompProfile.type')"
          @selecting="updateData"
        />
      </div>
    </div>
  </div>
</template>