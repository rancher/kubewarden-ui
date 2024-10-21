<script>
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import SeLinuxOptions from '../../../../components/PolicyServer/SeLinuxOptions.vue';
import SeccompProfile from '../../../../components/PolicyServer/SeccompProfile.vue';
import Capabilities from '../../../../components/PolicyServer/Capabilities.vue';
import WindowsOptions from '../../../../components/PolicyServer/WindowsOptions.vue';

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

    disabledByOsWindows: {
      type:     Boolean,
      default: false
    },

    disabledByOsLinux: {
      type:     Boolean,
      default: false
    }
  },

  components: {
    Loading,
    Checkbox,
    LabeledInput,
    SeLinuxOptions,
    SeccompProfile,
    Capabilities,
    WindowsOptions
  },

  async fetch() {},

  data() {
    return {
      allowPrivilegeEscalation:  this.value?.allowPrivilegeEscalation,
      capabilities:              this.value?.capabilities,
      privileged:                this.value?.privileged,
      procMount:                 this.value?.procMount,
      readOnlyRootFilesystem:    this.value?.readOnlyRootFilesystem,
      runAsNonRoot:              this.value?.runAsNonRoot,
      runAsGroup:                this.value?.runAsGroup,
      runAsUser:                 this.value?.runAsUser,
      seLinuxOptions:            this.value?.seLinuxOptions,
      seccompProfile:            this.value?.seccompProfile,
      windowsOptions:            this.value?.windowsOptions,
    };
  },

  methods: {
    updateData(val, key) {
      let parsedVal = val;

      if (key === 'runAsGroup' || key === 'runAsUser') {
        parsedVal = parseInt(val);
      }

      this.value[key] = parsedVal;
      this.$emit('update-container-config', this.value);
    }
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
          v-model:value="allowPrivilegeEscalation"
          :mode="mode"
          data-testid="ps-config-security-context-container-allow-priv-escalation-input"
          label-key="kubewarden.policyServerConfig.securityContexts.allow-priv-escalation.label"
          :tooltip="t('kubewarden.policyServerConfig.securityContexts.allow-priv-escalation.tooltip')"
          @update:value="updateData($event, 'allowPrivilegeEscalation')"
        />
      </div>
    </div>
    <!-- PRIVILEGED MODE -->
    <div class="row">
      <div class="col span-12 mb-20">
        <Checkbox
          v-model:value="privileged"
          :mode="mode"
          :disabled="disabledByOsWindows"
          data-testid="ps-config-security-context-container-privileged-input"
          label-key="kubewarden.policyServerConfig.securityContexts.privileged.label"
          :tooltip="t('kubewarden.policyServerConfig.securityContexts.privileged.tooltip')"
          @update:value="updateData($event, 'privileged')"
        />
      </div>
    </div>
    <!-- READ-ONLY ROOT FILESYSTEM -->
    <div class="row">
      <div class="col span-12 mb-20">
        <Checkbox
          v-model:value="readOnlyRootFilesystem"
          :mode="mode"
          :disabled="disabledByOsWindows"
          data-testid="ps-config-security-context-container-readOnlyRootFilesystem-input"
          label-key="kubewarden.policyServerConfig.securityContexts.readOnlyRootFilesystem.label"
          @update:value="updateData($event, 'readOnlyRootFilesystem')"
        />
      </div>
    </div>
    <!-- RUN AS NON ROOT -->
    <div class="row">
      <div class="col span-12 mb-40">
        <Checkbox
          v-model:value="runAsNonRoot"
          :mode="mode"
          data-testid="ps-config-security-context-container-runAsNonRoot-input"
          label-key="kubewarden.policyServerConfig.securityContexts.runAsNonRoot.label"
          @update:value="updateData($event, 'runAsNonRoot')"
        />
      </div>
    </div>
    <!-- CAPABILITIES -->
    <Capabilities
      :value="capabilities"
      :mode="mode"
      config-type="container"
      :disabled="disabledByOsWindows"
      @update-capabilities="updateData($event, 'capabilities')"
    />
    <!-- PROC MOUNT -->
    <div class="row mb-20">
      <div class="col span-6">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.procMount.label') }}
        </h4>
        <LabeledInput
          v-model:value="procMount"
          data-testid="ps-config-security-context-container-procMount-input"
          :mode="mode"
          :disabled="disabledByOsWindows"
          :label="t('kubewarden.policyServerConfig.securityContexts.procMount.label')"
          :placeholder="t('kubewarden.policyServerConfig.securityContexts.procMount.placeholder')"
          @update:value="updateData($event, 'procMount')"
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
          v-model:value.number="runAsGroup"
          data-testid="ps-config-security-context-container-runAsGroup-input"
          type="number"
          min="0"
          :mode="mode"
          :disabled="disabledByOsWindows"
          :label="t('kubewarden.policyServerConfig.securityContexts.runAsGroup')"
          @update:value="updateData($event, 'runAsGroup')"
        />
      </div>
    </div>
    <!-- RUN AS USER -->
    <div class="row mb-40">
      <div class="col span-6">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.runAsUser') }}
        </h4>
        <LabeledInput
          v-model:value.number="runAsUser"
          data-testid="ps-config-security-context-container-runAsUser-input"
          type="number"
          min="0"
          :mode="mode"
          :disabled="disabledByOsWindows"
          :label="t('kubewarden.policyServerConfig.securityContexts.runAsUser')"
          @update:value="updateData($event, 'runAsUser')"
        />
      </div>
    </div>
    <!-- SE LINUX OPTIONS -->
    <SeLinuxOptions
      :value="seLinuxOptions"
      :mode="mode"
      config-type="container"
      :disabled="disabledByOsWindows"
      @update-se-linux-options="updateData($event, 'seLinuxOptions')"
    />
    <!-- SECCOMP PROFILE -->
    <SeccompProfile
      :value="seccompProfile"
      :mode="mode"
      config-type="container"
      :disabled="disabledByOsWindows"
      @update-seccomp-profile="updateData($event, 'seccompProfile')"
    />
    <!-- WINDOWS OPTIONS -->
    <WindowsOptions
      :value="windowsOptions"
      :mode="mode"
      config-type="container"
      :disabled="disabledByOsLinux"
      @update-windows-options="updateData($event, 'windowsOptions')"
    />
  </div>
</template>