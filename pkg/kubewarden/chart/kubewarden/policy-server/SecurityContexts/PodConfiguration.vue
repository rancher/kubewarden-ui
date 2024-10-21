<script>
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';

import SeLinuxOptions from '../../../../components/PolicyServer/SeLinuxOptions.vue';
import SeccompProfile from '../../../../components/PolicyServer/SeccompProfile.vue';
import WindowsOptions from '../../../../components/PolicyServer/WindowsOptions.vue';
import ArrayListInteger from '../../../../components/ArrayListInteger.vue';
import SysctlsArrayList from '../../../../components/PolicyServer/SysctlsArrayList.vue';

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
    ArrayListInteger,
    SysctlsArrayList,
    WindowsOptions
  },

  async fetch() {},

  data() {
    return {
      fsGroup:             this.value?.fsGroup,
      fsGroupChangePolicy: this.value?.fsGroupChangePolicy,
      runAsNonRoot:        this.value?.runAsNonRoot,
      runAsGroup:          this.value?.runAsGroup,
      runAsUser:           this.value?.runAsUser,
      seLinuxOptions:      this.value?.seLinuxOptions,
      seccompProfile:      this.value?.seccompProfile,
      supplementalGroups:  this.value?.supplementalGroups,
      sysctls:             this.value?.sysctls,
      sysctlsInputLabel:   {
        name:  this.t('kubewarden.policyServerConfig.securityContexts.sysctls.name.label'),
        value: this.t('kubewarden.policyServerConfig.securityContexts.sysctls.value.label'),
      },
      sysctlsInputPlaceholderLabel: {
        name:  this.t('kubewarden.policyServerConfig.securityContexts.sysctls.name.placeholder'),
        value: this.t('kubewarden.policyServerConfig.securityContexts.sysctls.value.placeholder'),
      },
      windowsOptions: this.value?.windowsOptions,
    };
  },

  methods: {
    updateData(val, key) {
      let parsedVal = val;

      if (key === 'fsGroup' || key === 'runAsGroup' || key === 'runAsUser') {
        parsedVal = parseInt(val);
      }

      this.value[key] = parsedVal;
      this.$emit('update-pod-config', this.value);
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h3 class="mt-20">
      {{ t('kubewarden.policyServerConfig.securityContexts.podConfig') }}
    </h3>
    <!-- RUN AS NON ROOT -->
    <div class="row">
      <div class="col span-12 mb-40">
        <Checkbox
          v-model:value="runAsNonRoot"
          :mode="mode"
          data-testid="ps-config-security-context-pod-runAsNonRoot-input"
          label-key="kubewarden.policyServerConfig.securityContexts.runAsNonRoot.label"
          @update:value="updateData($event, 'runAsNonRoot')"
        />
      </div>
    </div>
    <!-- FS GROUP -->
    <div class="row mb-20">
      <div class="col span-6">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.fsGroup.label') }}
        </h4>
        <LabeledInput
          v-model:value.number="fsGroup"
          data-testid="ps-config-security-context-pod-fsGroup-input"
          type="number"
          min="0"
          :mode="mode"
          :disabled="disabledByOsWindows"
          :label="t('kubewarden.policyServerConfig.securityContexts.fsGroup.label')"
          @update:value="updateData($event, 'fsGroup')"
        />
      </div>
    </div>
    <!-- FS GROUP CHANGE POLICY -->
    <div class="row mb-20">
      <div class="col span-6">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.fsGroupChangePolicy.label') }}
        </h4>
        <LabeledInput
          v-model:value="fsGroupChangePolicy"
          data-testid="ps-config-security-context-pod-fsGroupChangePolicy-input"
          :mode="mode"
          :disabled="disabledByOsWindows"
          :label="t('kubewarden.policyServerConfig.securityContexts.fsGroupChangePolicy.label')"
          :placeholder="t('kubewarden.policyServerConfig.securityContexts.fsGroupChangePolicy.placeholder')"
          @update:value="updateData($event, 'fsGroupChangePolicy')"
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
          data-testid="ps-config-security-context-pod-runAsGroup-input"
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
          data-testid="ps-config-security-context-pod-runAsUser-input"
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
      config-type="pod"
      :disabled="disabledByOsWindows"
      @update-se-linux-options="updateData($event, 'seLinuxOptions')"
    />
    <!-- SECCOMP PROFILE -->
    <SeccompProfile
      :value="seccompProfile"
      :mode="mode"
      config-type="pod"
      :disabled="disabledByOsWindows"
      @update-seccomp-profile="updateData($event, 'seccompProfile')"
    />
    <!-- SUPLEMENTAL GROUPS -->
    <div class="row mb-40">
      <div class="col span-6">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.supplementalGroups.label') }}
        </h4>
        <ArrayListInteger
          :value="supplementalGroups"
          data-testid="ps-config-security-context-pod-supplementalGroups-input"
          :add-label="t('kubewarden.policyServerConfig.securityContexts.supplementalGroups.addLabel')"
          :input-label="t('kubewarden.policyServerConfig.securityContexts.supplementalGroups.label')"
          :mode="mode"
          :disabled="disabledByOsWindows"
          @update:value="updateData($event, 'supplementalGroups')"
        />
      </div>
    </div>
    <!-- SYSCTLS -->
    <div class="row mb-40">
      <div class="col">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.sysctls.label') }}
        </h4>
        <SysctlsArrayList
          :value="sysctls"
          data-testid="ps-config-security-context-pod-sysctls-input"
          :add-label="t('kubewarden.policyServerConfig.securityContexts.sysctls.addLabel')"
          :input-label="sysctlsInputLabel"
          :input-placeholder-label="sysctlsInputPlaceholderLabel"
          :mode="mode"
          :disabled="disabledByOsWindows"
          @update:value="updateData($event, 'sysctls')"
        />
      </div>
    </div>
    <!-- WINDOWS OPTIONS -->
    <WindowsOptions
      :value="windowsOptions"
      :mode="mode"
      config-type="pod"
      :disabled="disabledByOsLinux"
      @update-windows-options="updateData($event, 'windowsOptions')"
    />
  </div>
</template>