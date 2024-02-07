<script>
import { _CREATE } from '@shell/config/query-params';
import { CONFIG_MAP, SERVICE_ACCOUNT } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import ResourceFetch from '@shell/mixins/resource-fetch';

import Loading from '@shell/components/Loading';
import Tab from '@shell/components/Tabbed/Tab';
import Labels from '@shell/components/form/Labels';

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
    const hash = [
      this.$fetchType(CONFIG_MAP),
      this.$fetchType(SERVICE_ACCOUNT)
    ];

    await allHash(hash);
  },

  data() {
    if (!this.value.spec?.securityContexts) {
      this.value.spec.securityContexts = {
        container: {
          capabilities: {}, seLinuxOptions: {}, seccompProfile: {}
        },
        pod: {}
      };
    }

    return { chartValues: this.value };
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

    updateSecurityContexts(prop, val) {
      this.$set(this.chartValues.spec.securityContexts, prop, val);
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
