<script>
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import { Checkbox } from '@components/Form/Checkbox';
import ArrayList from '@shell/components/form/ArrayList';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import SeLinuxOptions from '../../../../components/PolicyServer/SeLinuxOptions.vue';
import SeccompProfile from '../../../../components/PolicyServer/SeccompProfile.vue';
import Capabilities from '../../../../components/PolicyServer/Capabilities.vue';

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

    disabledByOsWindows: {
      type:     Boolean,
      default: false
    }
  },

  components: {
    Loading,
    Checkbox,
    ArrayList,
    LabeledInput,
    LabeledSelect,
    SeLinuxOptions,
    SeccompProfile,
    Capabilities
  },

  async fetch() {},

  data() {
    return {
      allowPrivilegeEscalation:  this.value.allowPrivilegeEscalation,
      capabilities:              this.value.capabilities,
      privileged:                this.value.privileged,
      procMount:                 this.value.procMount,
      readOnlyRootFilesystem:    this.value.readOnlyRootFilesystem,
      runAsNonRoot:              this.value.runAsNonRoot,
      runAsGroup:                this.value.runAsGroup,
      runAsUser:                 this.value.runAsUser,
      seLinuxOptions:            this.value.seLinuxOptions,
      seccompProfile:            this.value.seccompProfile,
    };
  },

  methods: {
    updateData(val, key) {
      console.log(`updateData Container Config update ev key ::: ${ key }`, val);
      this.$emit('update-container-config', `container.${ key }`, val);
    },
    updateCapabilities(val) {
      console.log('updateCapabilities Container Config update ev', val);
      this.$emit('update-container-config', 'container.capabilities', val);
    },
    updateSeLinuxOptions(val) {
      console.log('updateSeLinuxOptions Container Config update ev', val);
      this.$emit('update-container-config', 'container.seLinuxOptions', val);
    },
    updateSeccompProfile(val) {
      console.log('updateSeccompProfile  Container Config update ev', val);
      this.$emit('update-container-config', 'container.seccompProfile', val);
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h3 class="mt-20">
      {{ t('kubewarden.policyServerConfig.securityContexts.containerConfig') }}
    </h3>
    <!-- ALLOW PRIVILEGED ESCALATION -->
    <div class="row mt-20">
      <div class="col span-12 mb-20">
        <Checkbox
          v-model="allowPrivilegeEscalation"
          :mode="mode"
          data-testid="ps-config-security-context-container-allow-priv-esc-input"
          label-key="kubewarden.policyServerConfig.securityContexts.allow-priv-escalation.label"
          :tooltip="t('kubewarden.policyServerConfig.securityContexts.allow-priv-escalation.tooltip')"
          @input="updateData($event, 'allowPrivilegeEscalation')"
        />
      </div>
    </div>
    <!-- PRIVILEGED MODE -->
    <div class="row">
      <div class="col span-12 mb-20">
        <Checkbox
          v-model="privileged"
          :mode="mode"
          :disabled="disabledByOsWindows"
          data-testid="ps-config-security-context-container-privileged-input"
          label-key="kubewarden.policyServerConfig.securityContexts.privileged.label"
          :tooltip="t('kubewarden.policyServerConfig.securityContexts.privileged.tooltip')"
          @input="updateData($event, 'privileged')"
        />
      </div>
    </div>
    <!-- READ-ONLY ROOT FILESYSTEM -->
    <div class="row">
      <div class="col span-12 mb-20">
        <Checkbox
          v-model="readOnlyRootFilesystem"
          :mode="mode"
          :disabled="disabledByOsWindows"
          data-testid="ps-config-security-context-container-readOnlyRootFilesystem-input"
          label-key="kubewarden.policyServerConfig.securityContexts.readOnlyRootFilesystem.label"
          @input="updateData($event, 'readOnlyRootFilesystem')"
        />
      </div>
    </div>
    <!-- RUN AS NON ROOT -->
    <div class="row">
      <div class="col span-12 mb-20">
        <Checkbox
          v-model="runAsNonRoot"
          :mode="mode"
          data-testid="ps-config-security-context-container-runAsNonRoot-input"
          label-key="kubewarden.policyServerConfig.securityContexts.runAsNonRoot.label"
          @input="updateData($event, 'runAsNonRoot')"
        />
      </div>
    </div>
    <!-- CAPABILITIES -->
    <Capabilities
      :value="capabilities"
      :mode="mode"
      config-type="container"
      :disabled="disabledByOsWindows"
      @update-capabilities="updateCapabilities($event, 'container')"
    />
    <!-- PROC MOUNT -->
    <div class="row mb-20">
      <div class="col span-6 mb-20">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.procMount.label') }}
        </h4>
        <LabeledInput
          v-model="procMount"
          data-testid="ps-config-security-context-container-procMount-input"
          :mode="mode"
          :disabled="disabledByOsWindows"
          :label="t('kubewarden.policyServerConfig.securityContexts.procMount.label')"
          :placeholder="t('kubewarden.policyServerConfig.securityContexts.procMount.placeholder')"
          @input="updateData($event, 'procMount')"
        />
      </div>
    </div>
    <!-- RUN AS GROUP -->
    <div class="row mb-20">
      <div class="col span-6">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.runAsGroup') }}
        </h4>
        <LabeledInput
          v-model.number="runAsGroup"
          data-testid="ps-config-security-context-container-runAsGroup-input"
          type="number"
          min="0"
          :mode="mode"
          :disabled="disabledByOsWindows"
          :label="t('kubewarden.policyServerConfig.securityContexts.runAsGroup')"
          @input="updateData($event, 'runAsGroup')"
        />
      </div>
    </div>
    <!-- RUN AS USER -->
    <div class="row mb-30">
      <div class="col span-6">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.runAsUser') }}
        </h4>
        <LabeledInput
          v-model.number="runAsUser"
          data-testid="ps-config-security-context-container-capabilities-runAsUser-input"
          type="number"
          min="0"
          :mode="mode"
          :disabled="disabledByOsWindows"
          :label="t('kubewarden.policyServerConfig.securityContexts.runAsUser')"
          @input="updateData($event, 'runAsUser')"
        />
      </div>
    </div>
    <!-- SE LINUX OPTIONS -->
    <SeLinuxOptions
      :value="seLinuxOptions"
      :mode="mode"
      config-type="container"
      :disabled="disabledByOsWindows"
      @update-se-linux-options="updateSeLinuxOptions($event, 'container')"
    />
    <!-- SECCOMP PROFILE -->
    <SeccompProfile
      :value="seccompProfile"
      :mode="mode"
      config-type="container"
      :disabled="disabledByOsWindows"
      @update-seccomp-profile="updateSeccompProfile($event, 'container')"
    />

    <!-- POD CONFIGURATION -->
    <div class="row mt-40">
      <h3 class="row">
        {{ t('kubewarden.policyServerConfig.securityContexts.podConfig') }}
      </h3>
    </div>
  </div>
</template>