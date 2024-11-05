<script>
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import ArrayList from '@shell/components/form/ArrayList';

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
    ArrayList,
  },

  async fetch() {},

  data() {
    return {
      add:  this.value?.add,
      drop: this.value?.drop
    };
  },
  methods: {
    updateData() {
      this.$emit('update-capabilities', {
        add:  this.add,
        drop: this.drop
      });
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h4 class="mb-20">
      {{ t('kubewarden.policyServerConfig.securityContexts.capabilities.title') }}
    </h4>
    <h5 class="mb-10">
      {{ t('kubewarden.policyServerConfig.securityContexts.capabilities.add') }}
    </h5>
    <div class="row mb-10">
      <div class="col span-6">
        <ArrayList
          v-model:value="add"
          :data-testid="`ps-config-security-context-${configType}-capabilities-add-input`"
          :disabled="disabled"
          :mode="mode"
          :add-allowed="true"
          :add-label="t('kubewarden.policyServerConfig.securityContexts.capabilities.addLabel')"
          :value-placeholder="t('kubewarden.policyServerConfig.securityContexts.capabilities.placeholder')"
          @update:value="updateData"
        />
      </div>
    </div>
    <h5 class="mb-10">
      {{ t('kubewarden.policyServerConfig.securityContexts.capabilities.drop') }}
    </h5>
    <div class="row mb-40">
      <div class="col span-6">
        <ArrayList
          v-model:value="drop"
          :data-testid="`ps-config-security-context-${configType}-capabilities-drop-input`"
          :disabled="disabled"
          :mode="mode"
          :add-allowed="true"
          :add-label="t('kubewarden.policyServerConfig.securityContexts.capabilities.addLabel')"
          :value-placeholder="t('kubewarden.policyServerConfig.securityContexts.capabilities.placeholder')"
          @update:value="updateData"
        />
      </div>
    </div>
  </div>
</template>