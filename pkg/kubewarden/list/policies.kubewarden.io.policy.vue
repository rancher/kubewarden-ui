<script>
import { CATALOG, UI_PLUGIN } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { mapPref, GROUP_RESOURCES } from '@shell/store/prefs';

import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';

import { KUBEWARDEN, KUBEWARDEN_APPS, KUBEWARDEN_CHARTS, KUBEWARDEN_PRODUCT_NAME } from '../types';
import { RELATED_HEADERS } from '../config/table-headers';
import { kwDefaultsHelmChartSettings } from '../modules/policies';

import DefaultsBanner from '../components/DefaultsBanner';

export default {
  components: {
    Banner, Loading, DefaultsBanner, ResourceTable
  },

  async fetch() {
    // needed to populate banner for edit settings compatibility for kubewarden-default CAP's
    if ( this.$store.getters['cluster/canList'](CATALOG.APP) ) {
      this.$store.dispatch('cluster/findAll', { type: CATALOG.APP });
    }

    if ( this.$store.getters['cluster/canList'](UI_PLUGIN) ) {
      this.$store.dispatch('cluster/findAll', { type: UI_PLUGIN });
    }

    await this.$store.dispatch('cluster/findAll', { type: KUBEWARDEN.CLUSTER_ADMISSION_POLICY });
    await this.$store.dispatch('cluster/findAll', { type: KUBEWARDEN.ADMISSION_POLICY });
  },

  data() {
    return { RELATED_HEADERS };
  },

  computed: {
    rows() {
      const out = [
        this.$store.getters['cluster/all'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY),
        this.$store.getters['cluster/all'](KUBEWARDEN.ADMISSION_POLICY)
      ];

      return out.flat();
    },

    allApps() {
      return this.$store.getters['cluster/all'](CATALOG.APP);
    },

    groupPreference() {
      const out = this._group === 'namespace' ? 'kind' : null;

      return out;
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

    <ResourceTable
      :rows="rows || []"
      :headers="RELATED_HEADERS"
      :groupable="true"
      :group-by="groupPreference"
      :table-actions="true"
      data-testid="kw-ps-detail-related-policies-list"
    >
      <template #col:operation="{ row }">
        <td>
          <BadgeState
            :data-testid="`kw-ps-detail-${ row.id }-state`"
            :label="row.operation"
            :color="color(row.operation)"
          />
        </td>
      </template>
    </ResourceTable>
  </div>
</template>