<script>
import { _CREATE } from '@shell/config/query-params';
import { CONFIG_MAP, SERVICE_ACCOUNT } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import ResourceFetch from '@shell/mixins/resource-fetch';

import Loading from '@shell/components/Loading';
import Tab from '@shell/components/Tabbed/Tab';
import Labels from '@shell/components/form/Labels';
import { SECCOMP_OPTIONS } from '../../../components/PolicyServer/SeccompProfile.vue';

import General from './General';
import SecurityContexts from './SecurityContexts';
import Registry from './Registry/Index';
import Verification from './Verification';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      default:  () => {}
    }
  },

  components: {
    General, SecurityContexts, Labels, Loading, Tab, Registry, Verification
  },

  mixins: [ResourceFetch],

  async fetch() {
    const hash = [];

    if ( this.$store.getters['cluster/canList'](CONFIG_MAP) ) {
      hash.push(this.$fetchList(CONFIG_MAP));
    }

    if ( this.$store.getters['cluster/canList'](SERVICE_ACCOUNT) ) {
      hash.push(this.$fetchList(SERVICE_ACCOUNT));
    }

    await allHash(hash);
  },

  data() {
    if (!this.value.spec?.securityContexts) {
      this.value.spec.securityContexts = {};
    }

    if (!this.value.spec?.securityContexts?.container) {
      this.value.spec.securityContexts.container = {};
    }

    if (!this.value.spec?.securityContexts?.pod) {
      this.value.spec.securityContexts.pod = {};
    }

    // defaults for this.value.spec.securityContexts.container object properties
    [
      ['capabilities', {}],
      ['seLinuxOptions', {}],
      ['seccompProfile', {}],
      ['windowsOptions', {}],
    ].forEach((item) => {
      if (!this.value.spec?.securityContexts?.container[item[0]]) {
        this.value.spec.securityContexts.container[item[0]] = item[1];
      }
    });

    // defaults for this.value.spec.securityContexts.pod object properties
    [
      ['seLinuxOptions', {}],
      ['seccompProfile', {}],
      ['windowsOptions', {}],
      ['supplementalGroups', []],
      ['sysctls', []],
    ].forEach((item) => {
      if (!this.value.spec?.securityContexts?.pod[item[0]]) {
        this.value.spec.securityContexts.pod[item[0]] = item[1];
      }
    });

    return {
      chartValues:      this.value,
      validationPassed: true,
    };
  },

  computed: {
    configMaps() {
      return this.$store.getters['cluster/all'](CONFIG_MAP);
    },

    serviceAccounts() {
      return this.$store.getters['cluster/all'](SERVICE_ACCOUNT);
    }
  },

  methods: {
    refresh() {
      try {
        /*
          A forceUpdate is needed for certain inputs within the Tab component
          that calculate the height to show loaded data
        */
        const keys = this.$refs.registry.$refs.sourceAuthorities.$refs.authority;

        for ( const k of keys ) {
          k?.$forceUpdate();
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Error refreshing authority refs: ${ e }`);
      }
    },

    updateGeneral(prop, val) {
      if ( prop === 'name' ) {
        this.$set(this.chartValues.metadata, prop, val);
      } else {
        this.$set(this.chartValues.spec, prop, val);
      }
    },

    updateSecurityContexts({ type, data }) {
      this.$set(this.chartValues.spec.securityContexts, type, data);

      // check "required" of sysctls
      // based on https://doc.crds.dev/github.com/kubewarden/kubewarden-controller/policies.kubewarden.io/PolicyServer/v1@v1.9.0#spec-securityContexts
      const sysctlsCheck = this.chartValues?.spec?.securityContexts?.pod?.sysctls || [];
      let isSysctlsValid = true;

      if (sysctlsCheck.length) {
        for (let i = 0; i < sysctlsCheck.length; i++) {
          if (!sysctlsCheck[i].name || !sysctlsCheck[i].value) {
            isSysctlsValid = false;
            break;
          }
        }
      }

      // check "required" of seccompProfile
      // based on https://doc.crds.dev/github.com/kubewarden/kubewarden-controller/policies.kubewarden.io/PolicyServer/v1@v1.9.0#spec-securityContexts
      let isSeccompProfileValid = true;

      ['container', 'pod'].forEach((type) => {
        const seccompProfileCheck = this.chartValues?.spec?.securityContexts?.[type]?.seccompProfile || {};
        const objKeys = Object.keys(seccompProfileCheck);

        if ((objKeys.includes('type') && !seccompProfileCheck.type) ||
         (objKeys.includes('type') && seccompProfileCheck.type === SECCOMP_OPTIONS.LOCALHOST && !seccompProfileCheck.localhostProfile)) {
          isSeccompProfileValid = false;
        }
      });

      this.$emit('validation-passed', isSysctlsValid && isSeccompProfileValid);
    },

    updateSpec(prop, val) {
      this.$set(this.chartValues.spec, prop, val);
    }
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else>
    <Tab name="general" label-key="kubewarden.tabs.general.label" :weight="99">
      <General
        v-model="chartValues"
        data-testid="ps-config-general-tab"
        :mode="mode"
        :service-accounts="serviceAccounts"
        @update-general="updateGeneral"
      />
    </Tab>
    <Tab name="security-contexts" label-key="kubewarden.tabs.security-contexts.label" :weight="98">
      <SecurityContexts
        v-model="chartValues.spec"
        data-testid="ps-config-security-contexts-tab"
        :mode="mode"
        @update-security-contexts="updateSecurityContexts"
      />
    </Tab>
    <Tab name="labels" label-key="generic.labelsAndAnnotations" :weight="97">
      <Labels v-model="chartValues" data-testid="ps-config-labels-tab" :mode="mode" />
    </Tab>
    <Tab name="verification" label-key="kubewarden.tabs.verification.label" :weight="96">
      <Verification
        data-testid="ps-config-verification-tab"
        :value="chartValues.spec"
        :mode="mode"
        :config-maps="configMaps"
        @update-vconfig="updateSpec"
      />
    </Tab>
    <Tab name="registry" label-key="kubewarden.tabs.registry.label" :weight="95" @active="refresh">
      <Registry
        ref="registry"
        data-testid="ps-config-registry-tab"
        :value="chartValues.spec"
        :mode="mode"
        @update-registry="updateSpec"
      />
    </Tab>
  </div>
</template>
