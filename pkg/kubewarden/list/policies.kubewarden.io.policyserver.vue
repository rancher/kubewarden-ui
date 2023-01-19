<script>
import { mapGetters } from 'vuex';

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
    await this.$store.dispatch(`${ this.currentProduct.inStore }/findAll`, { type: this.resource });
    await this.$store.dispatch('catalog/load');

    /*
      Determine if the default PolicyServer is installed from the `kubewarden-defaults` chart
      When installed the App name will be `rancher-kubewarden-defaults`
    */
    if ( !this.hideDefaultsBanner ) {
      const apps = await this.$store.dispatch(`${ this.currentProduct.inStore }/findAll`, { type: CATALOG.APP });

      this.hasDefaults = apps.find((a) => {
        return a.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_DEFAULTS;
      });
    }
  },

  data() {
    return { hasDefaults: null };
  },

  computed: {
    ...mapGetters(['currentProduct']),

    hideDefaultsBanner() {
      return this.$store.getters['kubewarden/hideDefaultsBanner'];
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
    <DefaultsBanner v-if="!hideDefaultsBanner && !hasDefaults" />
    <ResourceTable
      :schema="schema"
      :rows="rows"
    />
  </div>
</template>
