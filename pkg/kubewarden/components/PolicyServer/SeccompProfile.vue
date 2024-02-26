<script>
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export const SECCOMP_OPTIONS = {
  LOCALHOST:       'Localhost',
  RUNTIME_DEFAULT: 'RuntimeDefault',
  UNCONFINED:      'Unconfined'
};

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      default:  () => {}
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
    Checkbox,
    LabeledInput,
    LabeledSelect,
  },

  async fetch() {},

  data() {
    return {
      seccompProfileEnabled:      !!this.value?.localhostProfile || !!this.value?.type,
      isLocalhostProfileRequired: this.value?.type === 'Localhost',
      isLocalhostProfileDisabled: this.value?.type !== 'Localhost',
      localhostProfile:           this.value?.localhostProfile,
      type:                       this.value?.type,
      seccompProfileTypeOptions:  [SECCOMP_OPTIONS.LOCALHOST, SECCOMP_OPTIONS.RUNTIME_DEFAULT, SECCOMP_OPTIONS.UNCONFINED]
    };
  },
  methods: {
    updateData() {
      // logic based on spec description https://doc.crds.dev/github.com/kubewarden/kubewarden-controller/policies.kubewarden.io/PolicyServer/v1@v1.9.0#spec-securityContexts
      if (this.type !== 'Localhost') {
        this.localhostProfile = '';
        this.isLocalhostProfileDisabled = true;
        this.isLocalhostProfileRequired = false;
      } else {
        this.isLocalhostProfileDisabled = false;
        this.isLocalhostProfileRequired = true;
      }

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
  <div v-else class="mb-40">
    <!-- SECCOMP PROFILE -->
    <div class="row mb-20">
      <div class="col span-12">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.seccompProfile.title') }}
        </h4>
        <Checkbox
          v-model="seccompProfileEnabled"
          :mode="mode"
          :data-testid="`ps-config-security-context-container-${configType}-seccompProfile-enabled-input`"
          label-key="kubewarden.policyServerConfig.securityContexts.seccompProfile.inputEnabledLabel"
          @input="seccompProfileEnabled = $event"
        />
      </div>
    </div>
    <div v-if="seccompProfileEnabled">
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model="localhostProfile"
            :data-testid="`ps-config-security-context-container-${configType}-seccompProfile-localhostProfile-input`"
            :mode="mode"
            :disabled="disabled || isLocalhostProfileDisabled"
            :required="isLocalhostProfileRequired"
            :label="t('kubewarden.policyServerConfig.securityContexts.seccompProfile.localhostProfile.label')"
            :placeholder="t('kubewarden.policyServerConfig.securityContexts.seccompProfile.localhostProfile.placeholder')"
            @input="updateData"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model="type"
            :data-testid="`ps-config-security-context-container-${configType}-seccompProfile-type-input`"
            :mode="mode"
            :options="seccompProfileTypeOptions"
            :required="true"
            :disabled="disabled"
            :label="t('kubewarden.policyServerConfig.securityContexts.seccompProfile.type')"
            @selecting="updateData"
          />
        </div>
      </div>
    </div>
  </div>
</template>