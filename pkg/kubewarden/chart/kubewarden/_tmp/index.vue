<script>
import { _CREATE } from '@shell/config/query-params';
import { CAPI, CONFIG_MAP, SERVICE_ACCOUNT } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

import Tab from '@shell/components/Tabbed/Tab';

import General from './General';

export default {
  props: {
    chart: {
      type:    Object,
      default: () => ({}),
    },

    mode: {
      type:    String,
      default: _CREATE,
    },

    value: {
      type:    Object,
      default: () => ({}),
    },
  },

  components: { General, Tab },

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
  },

  data() {
    return {
      configMaps:      [],
      serviceAccounts: []
    };
  },
};
</script>

<template>
  <div>
    <Tab name="general" :label="t('kubewarden.install.tabs.general.label')" :weight="99">
      <General v-model="value" :mode="mode" />
    </Tab>
  </div>
</template>
