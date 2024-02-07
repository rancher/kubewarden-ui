<script>
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import ContainerConfiguration from './SecurityContexts/ContainerConfiguration.vue';

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
    Loading,
    ContainerConfiguration
  },

  async fetch() {},

  data() {
    return {
      containerConfiguration: this.value.securityContexts.container,
      podConfiguration:       this.value.securityContexts.pod
    };
  },

  methods: {
    updateContainerConfig(val) {
      this.$emit('update-security-contexts', 'container', val);
    },
    updatePodConfig(val) {
      this.$emit('update-security-contexts', 'pod', val);
    },
  },

  computed: {
    disabledByOsWindows() {
      return !this.value.os?.name === 'windows';
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ContainerConfiguration
      :value="containerConfiguration"
      :mode="mode"
      :disabled-by-os-windows="disabledByOsWindows"
      @update-container-config="updateContainerConfig"
    />

    <!-- POD CONFIGURATION -->
    <div class="row mt-40">
      <h3 class="row">
        {{ t('kubewarden.policyServerConfig.securityContexts.podConfig') }}
      </h3>
    </div>
  </div>
</template>