<script>
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import ContainerConfiguration from './SecurityContexts/ContainerConfiguration.vue';
import PodConfiguration from './SecurityContexts/PodConfiguration.vue';

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
    ContainerConfiguration,
    PodConfiguration,
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
      this.$emit('update-security-contexts', { type: 'container', data: val });
    },
    updatePodConfig(val) {
      this.$emit('update-security-contexts', { type: 'pod', data: val });
    },
  },

  computed: {
    disabledByOsWindows() {
      return !this.value.os?.name === 'windows';
    },
    disabledByOsLinux() {
      return !this.value.os?.name === 'linux';
    },
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
      :disabled-by-os-linux="disabledByOsLinux"
      @update-container-config="updateContainerConfig"
    />
    <PodConfiguration
      :value="podConfiguration"
      :mode="mode"
      :disabled-by-os-windows="disabledByOsWindows"
      :disabled-by-os-linux="disabledByOsLinux"
      @update-pod-config="updatePodConfig"
    />
  </div>
</template>