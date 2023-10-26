<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { CATALOG } from '@shell/config/labels-annotations';

import {
  REPO_TYPE, REPO, CHART, NAME, VERSION, NAMESPACE
} from '@shell/config/query-params';

import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';

import { handleGrowl } from '../utils/handle-growl';
import { addKubewardenDashboards } from '../modules/grafana';
import { serviceMonitorsConfigured } from '../modules/metricsConfig';

export default {
  props: {
    controllerApp: {
      type:    Object,
      default: null
    },
    controllerChart: {
      type:    Object,
      default: null
    },
    kubewardenDashboards: {
      type:    Array,
      default: null
    },
    monitoringApp: {
      type:    Object,
      default: null
    },
    monitoringChart: {
      type:    Object,
      default: null
    },
    openTelSvc: {
      type:    Object,
      default: null
    }
  },

  components: { AsyncButton, Banner },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ t: 'i18n/t' }),

    controllerMetricsConfig() {
      if ( this.controllerApp ) {
        return this.controllerApp.spec?.values?.telemetry?.metrics;
      }

      return null;
    },

    controllerLinkDisabled() {
      return (!this.monitoringApp || !this.monitoringIsConfigured || !this.controllerChart || !this.controllerApp);
    },

    controllerLinkTooltip() {
      if ( this.controllerLinkDisabled ) {
        return this.t('kubewarden.monitoring.prerequisites.controllerConfig.tooltip');
      }

      if ( !this.controllerChart ) {
        return this.t('kubewarden.monitoring.prerequisites.controllerConfig.chartError');
      }

      return null;
    },

    dashboardsTooltip() {
      if ( !this.monitoringApp ) {
        return this.t('kubewarden.monitoring.prerequisites.configMap.tooltip.appNotInstalled');
      }

      if ( this.monitoringApp && !this.monitoringIsConfigured ) {
        return this.t('kubewarden.monitoring.prerequisites.configMap.tooltip.appNotConfigured');
      }

      return null;
    },

    emptyKubewardenDashboards() {
      return isEmpty(this.kubewardenDashboards);
    },

    metricsEnabled() {
      if ( this.controllerMetricsConfig ) {
        return this.controllerMetricsConfig.enabled;
      }

      return null;
    },

    monitoringChartLink() {
      if ( !this.monitoringApp ) {
        return this.t('kubewarden.monitoring.prerequisites.monitoringApp.install');
      }

      return this.t('kubewarden.monitoring.prerequisites.monitoringApp.edit');
    },

    monitoringLinkTooltip() {
      if ( !this.monitoringChart ) {
        return this.t('kubewarden.monitoring.prerequisites.monitoringApp.chartError');
      }

      return null;
    },

    monitoringServiceMonitorsSpec() {
      if ( this.monitoringApp ) {
        return this.monitoringApp.spec?.values?.prometheus?.additionalServiceMonitors;
      }

      return null;
    },

    monitoringIsConfigured() {
      return serviceMonitorsConfigured({
        serviceMonitorSpec: this.monitoringServiceMonitorsSpec,
        controllerApp:      this.controllerApp,
        policyServerSvcs:   this.policyServerSvcs
      });
    }
  },

  methods: {
    async addDashboards(btnCb) {
      try {
        await addKubewardenDashboards({
          store:         this.$store,
          monitoringApp: this.monitoringApp,
          controllerApp: this.controllerApp
        });
        btnCb(true);

        this.reloadRequired = true;
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });

        btnCb(false);
      }
    },

    monitoringAppRoute() {
      if ( !this.monitoringApp && this.monitoringChart ) {
        this.monitoringChart.goToInstall();
      }

      if ( this.monitoringApp ) {
        const query = {
          [NAMESPACE]: this.monitoringApp.metadata?.namespace,
          [NAME]:      this.monitoringApp.metadata?.name,
          [VERSION]:   this.monitoringApp.spec?.chart?.metadata?.version,
          [REPO]:      this.monitoringApp.spec?.chart?.metadata?.annotations?.[CATALOG.SOURCE_REPO_NAME],
          [REPO_TYPE]: this.monitoringApp.spec?.chart?.metadata?.annotations?.[CATALOG.SOURCE_REPO_TYPE],
          [CHART]:     this.monitoringApp.spec?.chart?.metadata?.name
        };

        this.$router.push({
          name:   'c-cluster-apps-charts-install',
          params: { cluster: this.currentCluster?.id || '_' },
          query,
        });
      }
    },

    controllerAppRoute() {
      if ( this.controllerApp ) {
        const metadata = this.controllerApp.spec?.chart?.metadata;

        const query = {
          [NAMESPACE]: metadata?.annotations?.[CATALOG.NAMESPACE],
          [NAME]:      metadata?.annotations?.[CATALOG.RELEASE_NAME],
          [VERSION]:   metadata?.annotations?.['catalog.cattle.io/upstream-version'],
          [REPO]:      metadata?.annotations?.[CATALOG.SOURCE_REPO_NAME],
          [REPO_TYPE]: metadata?.annotations?.[CATALOG.SOURCE_REPO_TYPE],
          [CHART]:     metadata?.name
        };

        this.$router.push({
          name:   'c-cluster-apps-charts-install',
          params: { cluster: this.currentCluster?.id || '_' },
          query,
        });
      }
    }
  }
};
</script>

<template>
  <div class="checklist__container">
    <div class="checklist__prereq mb-20">
      <h2>{{ t('kubewarden.monitoring.prerequisites.label') }}</h2>
      <p>{{ t('kubewarden.monitoring.prerequisites.description') }}</p>
    </div>
    <Banner
      color="warning"
      :label="t('kubewarden.monitoring.prerequisites.warning')"
    />
    <div class="mt-20 mb-20">
      <div class="checklist__step mt-20 mb-20" data-testid="kw-monitoring-checklist-step-open-tel">
        <i class="icon mr-10" :class="{ 'icon-dot-open': !openTelSvc,'icon-checkmark': openTelSvc }" />
        <p v-clean-html="t('kubewarden.tracing.openTelemetry', {}, true)" />
      </div>
      <div class="checklist__step mb-20" data-testid="kw-monitoring-checklist-step-monitoring-app">
        <i
          class="icon mr-10"
          :class="{ 'icon-dot-open': !monitoringApp || !monitoringIsConfigured,'icon-checkmark': monitoringApp && monitoringIsConfigured }"
        />
        <div class="checklist__config">
          <p v-clean-html="t('kubewarden.monitoring.prerequisites.monitoringApp.label', {}, true)" p />
          <button
            v-if="!monitoringApp || !monitoringIsConfigured"
            v-clean-tooltip="monitoringLinkTooltip"
            data-testid="kw-monitoring-checklist-step-config-button"
            class="btn role-primary ml-10"
            :disabled="!monitoringChart"
            @click="monitoringAppRoute()"
          >
            {{ monitoringChartLink }}
          </button>
        </div>
      </div>
      <div class="checklist__step mb-20" data-testid="kw-monitoring-checklist-step-config-map">
        <i class="icon mr-10" :class="{ 'icon-dot-open': emptyKubewardenDashboards,'icon-checkmark': !emptyKubewardenDashboards }" />
        <div class="checklist__config">
          <p v-clean-html="t('kubewarden.monitoring.prerequisites.configMap.label', {}, true)" p />
          <AsyncButton
            v-if="emptyKubewardenDashboards"
            v-clean-tooltip="dashboardsTooltip"
            data-testid="kw-monitoring-checklist-step-config-map-button"
            mode="grafanaDashboard"
            class="ml-10"
            :disabled="!monitoringApp || !monitoringIsConfigured"
            @click="addDashboards"
          />
        </div>
      </div>
      <div class="checklist__step mb-20" data-testid="kw-monitoring-checklist-step-controller-config">
        <i class="icon mr-10" :class="{ 'icon-dot-open': !metricsEnabled,'icon-checkmark': metricsEnabled }" />
        <div class="checklist__config">
          <p v-clean-html="t('kubewarden.monitoring.prerequisites.controllerConfig.label', {}, true)" p />
          <button
            v-if="!metricsEnabled"
            v-clean-tooltip="controllerLinkTooltip"
            data-testid="kw-monitoring-checklist-step-config-button"
            class="btn role-primary ml-10"
            :disabled="controllerLinkDisabled"
            @click="controllerAppRoute()"
          >
            {{ t("kubewarden.monitoring.prerequisites.controllerConfig.button") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.checklist {
  &__container {
    display: flex;
    justify-content: center;
    flex-direction: column;
    border: 1px solid var(--border);
    padding: 10px;
  }

  &__step, &__config {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
  }

  &__step {
    min-height: 40px;
  }
}
</style>