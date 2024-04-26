<script>
import { CATALOG, UI_PLUGIN } from '@shell/config/types';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { KUBEWARDEN_APPS, KUBEWARDEN_CHARTS, KUBEWARDEN_PRODUCT_NAME } from '../types';
import { kwDefaultsHelmChartSettings } from '../modules/policies';

import PolicyList from '../components/Policies/PolicyList';
import DefaultsBanner from '../components/DefaultsBanner';

export default {
  components: {
    Banner, Loading, PolicyList, DefaultsBanner
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
    // needed to populate banner for edit settings compatibility for kubewarden-default CAP's
    if ( this.$store.getters['cluster/canList'](CATALOG.APP) ) {
      this.$store.dispatch('cluster/findAll', { type: CATALOG.APP });
    }
    if ( this.$store.getters['cluster/canList'](UI_PLUGIN) ) {
      this.$store.dispatch('cluster/findAll', { type: UI_PLUGIN });
    }
    await this.$store.dispatch('cluster/findAll', { type: this.resource });
  },

  computed: {
    rows() {
      return this.$store.getters['cluster/all'](this.resource);
    },
    allApps() {
      return this.$store.getters['cluster/all'](CATALOG.APP);
    },
    kubewardenDefaultsApp() {
      if ( this.allApps ) {
        return this.allApps?.find((a) => {
          return (
            a.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_DEFAULTS ||
            a.spec?.chart?.metadata?.name === KUBEWARDEN_CHARTS.DEFAULTS
          );
        });
      }

      return null;
    },
    kubewardenExtension() {
      const extensionsInstalled = this.$store.getters['uiplugins/plugins'] || [];

      return extensionsInstalled?.find(ext => ext?.id?.includes(KUBEWARDEN_PRODUCT_NAME));
    },
    kwDefaultsHelmChartSettingsCompatible() {
      const kwDefaultsVersion = this.kubewardenDefaultsApp?.spec?.chart?.metadata?.version;
      const uiPluginVersion = this.kubewardenExtension?.version;

      if ( kwDefaultsVersion && uiPluginVersion) {
        return kwDefaultsHelmChartSettings(kwDefaultsVersion, uiPluginVersion);
      }

      return true;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner
      data-testid="kw-cap-list-banner"
      class="type-banner mb-20 mt-0"
      color="info"
      :label="t('kubewarden.clusterAdmissionPolicy.description')"
    />
    <DefaultsBanner
      v-if="!kwDefaultsHelmChartSettingsCompatible"
      mode="upgrade"
    />

    <PolicyList data-testid="kw-cap-policy-list" :resource="resource" :rows="rows" :schema="schema" />
  </div>
</template>
