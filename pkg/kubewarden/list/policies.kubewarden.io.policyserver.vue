<script>
import { mapGetters } from 'vuex';

import { CATALOG } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';

import { KUBEWARDEN_APPS, KUBEWARDEN_CHARTS } from '../types';

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
    await this.$store.dispatch(`${ this.currentProduct.inStore }/findAll`, { type: this.resource });
    await this.$store.dispatch('catalog/load');

    if ( !this.hideBannerDefaults ) {
      this.apps = await this.$store.dispatch(`${ this.currentProduct.inStore }/findAll`, { type: CATALOG.APP });
    }
  },

  data() {
    return { apps: null };
  },

  computed: {
    ...mapGetters(['currentProduct']),

    defaultsApp() {
      return this.apps?.find((a) => {
        return a.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_DEFAULTS;
      });
    },

    hideBannerDefaults() {
      return this.$store.getters['kubewarden/hideBannerDefaults'] || !!this.defaultsApp;
    },

    rows() {
      return this.$store.getters[`${ this.currentProduct.inStore }/all`](this.resource);
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
    />
  </div>
</template>
