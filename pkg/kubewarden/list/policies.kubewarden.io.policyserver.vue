<script>
import { CATALOG } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';

import { KUBEWARDEN_APPS } from '../types';

import DefaultsBanner from '../components/DefaultsBanner';

export default {
  components: {
    DefaultsBanner, Loading, ResourceTable
  },

  props: {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('cluster/findAll', { type: this.resource });

    if ( this.$store.getters['cluster/canList'](CATALOG.APP) ) {
      await this.$store.dispatch('catalog/load');

      if ( !this.hideBannerDefaults ) {
        this.apps = await this.$store.dispatch('cluster/findAll', { type: CATALOG.APP });
      }
    }
  },

  data() {
    return { apps: null };
  },

  computed: {
    defaultsApp() {
      return this.apps?.find((a) => {
        return a.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_DEFAULTS;
      });
    },

    hideBannerDefaults() {
      return this.$store.getters['kubewarden/hideBannerDefaults'] || !!this.defaultsApp;
    },

    rows() {
      return this.$store.getters['cluster/all'](this.resource);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <DefaultsBanner v-if="!hideBannerDefaults" />
    <ResourceTable
      :schema="schema"
      :rows="rows"
      data-testid="kw-ps-resource-table"
    />
  </div>
</template>
