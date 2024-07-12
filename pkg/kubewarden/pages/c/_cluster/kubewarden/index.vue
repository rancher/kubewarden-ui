<script>
import { CATALOG, WORKLOAD_TYPES } from '@shell/config/types';

import { Banner } from '@components/Banner';

import { KUBEWARDEN } from '../../../../types';
import { isAirgap } from '../../../../utils/determine-airgap';
import { isAdminUser } from '../../../../utils/permissions';

import DashboardView from '../../../../components/Dashboard/DashboardView';
import InstallView from '../../../../components/Dashboard/InstallView';

export default {
  name: 'Dashboard',

  components: {
    Banner, DashboardView, InstallView
  },

  async fetch() {
    this.isAdminUser = isAdminUser(this.$store.getters);
    const types = {
      policyServer:           { type: KUBEWARDEN.POLICY_SERVER },
      admissionPolicy:        { type: KUBEWARDEN.ADMISSION_POLICY },
      clusterAdmissionPolicy: { type: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
      app:                    { type: CATALOG.APP },
      deployment:             { type: WORKLOAD_TYPES.DEPLOYMENT }
    };

    for ( const [key, value] of Object.entries(types) ) {
      if ( this.$store.getters['cluster/canList'](value) ) {
        this.permissions[key] = true;
      }
    }

    this.isAirgap = await isAirgap({ store: this.$store });
  },

  data() {
    return {
      isAdminUser: false,
      permissions: {
        policyServer:           false,
        admissionPolicy:        false,
        clusterAdmissionPolicy: false,
        app:                    false,
        deployment:             false
      },
      isAirgap: null
    };
  },

  computed: {
    hasAvailability() {
      return this.isAdminUser || Object.values(this.permissions).every(value => value);
    },

    hasSchema() {
      return this.$store.getters['cluster/schemaFor'](KUBEWARDEN.POLICY_SERVER);
    }
  }
};
</script>

<template>
  <div v-if="!hasAvailability">
    <Banner
      color="error"
      class="mt-20 mb-20"
      data-testid="kw-unavailability-banner"
      label-key="kubewarden.unavailability.banner"
    />
  </div>
  <div v-else>
    <InstallView v-if="!hasSchema" :has-schema="hasSchema" />
    <DashboardView v-else />
  </div>
</template>
