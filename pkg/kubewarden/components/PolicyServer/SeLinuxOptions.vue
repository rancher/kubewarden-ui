<script>
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
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
    LabeledInput,
  },

  async fetch() {},

  data() {
    return {
      level: this.value?.level,
      role:  this.value?.role,
      type:  this.value?.type,
      user:  this.value?.user,
    };
  },
  methods: {
    updateData() {
      this.$emit('update-se-linux-options', {
        level: this.level,
        role:  this.role,
        type:  this.type,
        user:  this.user,
      });
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <!-- SE LINUX OPTIONS -->
    <div class="row mb-10">
      <div class="col span-6">
        <h4>
          {{ t('kubewarden.policyServerConfig.securityContexts.seLinuxOptions.title') }}
        </h4>
        <LabeledInput
          v-model:value="level"
          :data-testid="`ps-config-security-context-${configType}-seLinuxOptions-level-input`"
          :mode="mode"
          :disabled="disabled"
          :label="t('kubewarden.policyServerConfig.securityContexts.seLinuxOptions.level.label')"
          :placeholder="t('kubewarden.policyServerConfig.securityContexts.seLinuxOptions.level.placeholder')"
          @update:value="updateData($event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="role"
          :data-testid="`ps-config-security-context-${configType}-seLinuxOptions-role-input`"
          :mode="mode"
          :disabled="disabled"
          :label="t('kubewarden.policyServerConfig.securityContexts.seLinuxOptions.role.label')"
          :placeholder="t('kubewarden.policyServerConfig.securityContexts.seLinuxOptions.role.placeholder')"
          @update:value="updateData($event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="type"
          :data-testid="`ps-config-security-context-${configType}-seLinuxOptions-type-input`"
          :mode="mode"
          :disabled="disabled"
          :label="t('kubewarden.policyServerConfig.securityContexts.seLinuxOptions.type.label')"
          :placeholder="t('kubewarden.policyServerConfig.securityContexts.seLinuxOptions.type.placeholder')"
          @update:value="updateData($event)"
        />
      </div>
    </div>
    <div class="row mb-40">
      <div class="col span-6">
        <LabeledInput
          v-model:value="user"
          :data-testid="`ps-config-security-context-${configType}-seLinuxOptions-user-input`"
          :mode="mode"
          :disabled="disabled"
          :label="t('kubewarden.policyServerConfig.securityContexts.seLinuxOptions.user.label')"
          :placeholder="t('kubewarden.policyServerConfig.securityContexts.seLinuxOptions.user.placeholder')"
          @update:value="updateData($event)"
        />
      </div>
    </div>
  </div>
</template>