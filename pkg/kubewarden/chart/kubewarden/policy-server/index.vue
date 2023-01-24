<script>
import merge from 'lodash/merge';
import { _CREATE } from '@shell/config/query-params';
import { CAPI, CONFIG_MAP, SERVICE_ACCOUNT } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { clone } from '@shell/utils/object';

import Loading from '@shell/components/Loading';
import Tab from '@shell/components/Tabbed/Tab';
import Labels from '@shell/components/form/Labels';

import General from './General';
import Registry from './Registry/Index';
import Verification from './Verification';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    resource: {
      type:    Object,
      default: () => {}
    },

    value: {
      type:     Object,
      default:  () => {}
    }
  },

  components: {
    General, Labels, Loading, Tab, Registry, Verification
  },

  async fetch() {
    const requests = { rancherClusters: this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }) };
    const needed = {
      configMaps:      CONFIG_MAP,
      serviceAccounts: SERVICE_ACCOUNT,
    };

    // Only fetch types if the user can see them
    Object.keys(needed).forEach((key) => {
      const type = needed[key];

      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        requests[key] = this.$store.dispatch('cluster/findAll', { type });
      }
    });

    const hash = await allHash(requests);

    this.configMaps = hash.configMaps || [];
    this.serviceAccounts = hash.serviceAccounts || [];

    /*
      Cloning the resource here to update the labels and annotations because the structuredClone
      of the DEFAULT_POLICY will not contain the model functions: `setLabels`, `setAnnotations`.
    */
    this.resourceClone = clone(this.resource);
  },

  data() {
    return {
      chartValues:     this.value.questions,
      resourceClone:   null,
      configMaps:      [],
      serviceAccounts: []
    };
  },

  watch: {
    'resourceClone.metadata': {
      deep:    true,
      handler: 'update'
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

    update(e) {
      merge(this.chartValues.metadata, e);
    }
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else>
    <Tab name="general" label-key="kubewarden.tabs.general.label" :weight="99">
      <General v-model="chartValues" :mode="mode" :service-accounts="serviceAccounts" />
    </Tab>
    <Tab name="labels" label-key="generic.labelsAndAnnotations" :weight="98">
      <Labels v-model="resourceClone" :mode="mode" />
    </Tab>
    <Tab name="verification" label-key="kubewarden.tabs.verification.label" :weight="97">
      <Verification :value="chartValues.spec" :mode="mode" :config-maps="configMaps" />
    </Tab>
    <Tab name="registry" label-key="kubewarden.tabs.registry.label" :weight="96" @active="refresh">
      <Registry ref="registry" :value="chartValues.spec" :mode="mode" />
    </Tab>
  </div>
</template>
