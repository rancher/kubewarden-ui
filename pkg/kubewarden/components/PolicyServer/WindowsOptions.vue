<script>
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';

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
  },

  async fetch() {},

  data() {
    return {
      gmsaCredentialSpec:     this.value?.gmsaCredentialSpec,
      gmsaCredentialSpecName: this.value?.gmsaCredentialSpecName,
      hostProcess:            this.value?.hostProcess,
      runAsUserName:          this.value?.runAsUserName,
    };
  },
  methods: {
    updateData() {
      this.$emit('update-windows-options', {
        gmsaCredentialSpec:     this.gmsaCredentialSpec,
        gmsaCredentialSpecName: this.gmsaCredentialSpecName,
        hostProcess:            this.hostProcess,
        runAsUserName:          this.runAsUserName,
      });
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <!-- SE LINUX OPTIONS -->
    <div class="row mb-20">
      <div class="col span-12">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.windowsOptions.title') }}
        </h4>
        <Checkbox
          v-model:value="hostProcess"
          :mode="mode"
          :disabled="disabled"
          :data-testid="`ps-config-security-context-${configType}-windowsOptions-hostProcess-input`"
          label-key="kubewarden.policyServerConfig.securityContexts.windowsOptions.hostProcess.label"
          :tooltip="t('kubewarden.policyServerConfig.securityContexts.windowsOptions.hostProcess.tooltip')"
          @update:value="updateData($event, 'hostProcess')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="gmsaCredentialSpec"
          :data-testid="`ps-config-security-context-${configType}-windowsOptions-gmsaCredentialSpec-input`"
          :mode="mode"
          :disabled="disabled"
          :label="t('kubewarden.policyServerConfig.securityContexts.windowsOptions.gmsaCredentialSpec.label')"
          :placeholder="t('kubewarden.policyServerConfig.securityContexts.windowsOptions.gmsaCredentialSpec.placeholder')"
          @update:value="updateData($event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="gmsaCredentialSpecName"
          :data-testid="`ps-config-security-context-${configType}-windowsOptions-gmsaCredentialSpecName-input`"
          :mode="mode"
          :disabled="disabled"
          :label="t('kubewarden.policyServerConfig.securityContexts.windowsOptions.gmsaCredentialSpecName.label')"
          :placeholder="t('kubewarden.policyServerConfig.securityContexts.windowsOptions.gmsaCredentialSpecName.placeholder')"
          @update:value="updateData($event)"
        />
      </div>
    </div>
    <div class="row mb-40">
      <div class="col span-6">
        <LabeledInput
          v-model:value="runAsUserName"
          :data-testid="`ps-config-security-context-${configType}-windowsOptions-runAsUserName-input`"
          :mode="mode"
          :disabled="disabled"
          :label="t('kubewarden.policyServerConfig.securityContexts.windowsOptions.runAsUserName.label')"
          :placeholder="t('kubewarden.policyServerConfig.securityContexts.windowsOptions.runAsUserName.placeholder')"
          @update:value="updateData($event)"
        />
      </div>
    </div>
  </div>
</template>