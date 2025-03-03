<script>
import { reactive } from 'vue';

import { _CREATE } from '@shell/config/query-params';
import { CONFIG_MAP, SERVICE_ACCOUNT } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import ResourceFetch from '@shell/mixins/resource-fetch';

import Loading from '@shell/components/Loading';
import Tab from '@shell/components/Tabbed/Tab';
import Labels from '@shell/components/form/Labels';

import { SECCOMP_OPTIONS } from '@kubewarden/components/PolicyServer/SeccompProfile.vue';
import General from './General.vue';
import SecurityContexts from './SecurityContexts.vue';
import Registry from './Registry/Index.vue';
import Verification from './Verification.vue';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },

    value: {
      type:    Object,
      default: () => ({}),
    },
  },

  components: {
    General,
    SecurityContexts,
    Labels,
    Loading,
    Tab,
    Registry,
    Verification,
  },

  mixins: [ResourceFetch],

  async fetch() {
    const hash = [];

    if (this.$store.getters['cluster/canList'](CONFIG_MAP)) {
      hash.push(this.$fetchType(CONFIG_MAP));
    }

    if (this.$store.getters['cluster/canList'](SERVICE_ACCOUNT)) {
      hash.push(this.$fetchType(SERVICE_ACCOUNT));
    }

    await allHash(hash);
  },

  data() {
    const chartValues = reactive({ ...this.value });

    // Ensure chartValues.spec and nested objects are reactive
    if (!chartValues.spec) {
      chartValues.spec = {};
    }

    if (!chartValues.spec.securityContexts) {
      chartValues.spec.securityContexts = {};
    }

    if (!chartValues.spec.securityContexts.container) {
      chartValues.spec.securityContexts.container = {};
    }

    if (!chartValues.spec.securityContexts.pod) {
      chartValues.spec.securityContexts.pod = {};
    }

    // Defaults for chartValues.spec.securityContexts.container properties
    [
      ['capabilities', {}],
      ['seLinuxOptions', {}],
      ['seccompProfile', {}],
      ['windowsOptions', {}],
    ].forEach(([key, defaultValue]) => {
      if (!chartValues.spec.securityContexts.container[key]) {
        chartValues.spec.securityContexts.container[key] = defaultValue;
      }
    });

    // Defaults for chartValues.spec.securityContexts.pod properties
    [
      ['seLinuxOptions', {}],
      ['seccompProfile', {}],
      ['windowsOptions', {}],
      ['supplementalGroups', []],
      ['sysctls', []],
    ].forEach(([key, defaultValue]) => {
      if (!chartValues.spec.securityContexts.pod[key]) {
        chartValues.spec.securityContexts.pod[key] = defaultValue;
      }
    });

    return {
      chartValues,
      validationPassed: true,
      registryRef:      null,
    };
  },

  computed: {
    configMaps() {
      return this.$store.getters['cluster/all'](CONFIG_MAP);
    },
    serviceAccounts() {
      return this.$store.getters['cluster/all'](SERVICE_ACCOUNT);
    },
  },

  methods: {
    refresh() {
      try {
        /*
          A forceUpdate is needed for certain inputs within the Tab component
          that calculate the height to show loaded data
        */
        const keys = this.$refs.registryRef.$refs.sourceAuthorities.$refs.authority;

        for (const k of keys) {
          k?.$forceUpdate();
        }
      } catch (e) {
        console.warn(`Error refreshing authority refs: ${ e }`);
      }
    },
    updateGeneral(prop, val) {
      if (prop === 'name') {
        this.chartValues.metadata[prop] = val;
      } else {
        this.chartValues.spec[prop] = val;
      }
    },
    updateSecurityContexts({ type, data }) {
      this.chartValues.spec.securityContexts[type] = data;

      // Validate sysctls and seccompProfile
      const sysctls = this.chartValues.spec.securityContexts.pod.sysctls || [];
      let isSysctlsValid = true;

      if (sysctls.length) {
        for (const sysctl of sysctls) {
          if (!sysctl.name || !sysctl.value) {
            isSysctlsValid = false;
            break;
          }
        }
      }

      let isSeccompProfileValid = true;

      ['container', 'pod'].forEach((contextType) => {
        const seccompProfile = this.chartValues.spec.securityContexts[contextType].seccompProfile || {};
        const hasType = 'type' in seccompProfile;
        const isLocalhost = seccompProfile.type === SECCOMP_OPTIONS.LOCALHOST;

        if ((hasType && !seccompProfile.type) || (isLocalhost && !seccompProfile.localhostProfile)) {
          isSeccompProfileValid = false;
        }
      });

      this.$emit('validation-passed', isSysctlsValid && isSeccompProfileValid);
    },
    updateSpec(prop, val) {
      this.chartValues.spec[prop] = val;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else>
    <Tab name="general" label-key="kubewarden.tabs.general.label" :weight="99">
      <General
        v-model:value="chartValues"
        data-testid="ps-config-general-tab"
        :mode="mode"
        :service-accounts="serviceAccounts"
        @update-general="updateGeneral"
      />
    </Tab>
    <Tab name="security-contexts" label-key="kubewarden.tabs.security-contexts.label" :weight="98">
      <SecurityContexts
        v-model:value="chartValues.spec"
        data-testid="ps-config-security-contexts-tab"
        :mode="mode"
        @update-security-contexts="updateSecurityContexts"
      />
    </Tab>
    <Tab name="labels" label-key="generic.labelsAndAnnotations" :weight="97">
      <Labels :value="value" data-testid="ps-config-labels-tab" :mode="mode" />
    </Tab>
    <Tab name="verification" label-key="kubewarden.tabs.verification.label" :weight="96">
      <Verification
        data-testid="ps-config-verification-tab"
        v-model:value="chartValues.spec"
        :mode="mode"
        :config-maps="configMaps"
        @update-vconfig="updateSpec"
      />
    </Tab>
    <Tab name="registry" label-key="kubewarden.tabs.registry.label" :weight="95" @active="refresh">
      <Registry
        ref="registryRef"
        data-testid="ps-config-registry-tab"
        v-model:value="chartValues.spec"
        :mode="mode"
        @update-registry="updateSpec"
      />
    </Tab>
  </div>
</template>
