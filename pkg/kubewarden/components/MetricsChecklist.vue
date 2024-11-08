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
import { addKubewardenServiceMonitor } from '../modules/metricsConfig';

export default {
  props: {
    cattleDashboardNs: {
      type:    Object,
      default: null
    },
    conflictingGrafanaDashboards: {
      type:    Array,
      default: null
    },
    controllerApp: {
      type:    Object,
      default: null
    },
    controllerChart: {
      type:    Object,
      default: null
    },
    kubewardenServiceMonitor: {
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
    },
    policyObj: {
      type:    Object,
      default: null
    },
    policyServerObj: {
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
      return (!this.openTelSvc || !this.monitoringApp || !this.hasKubewardenDashboards || !this.controllerChart || !this.controllerApp);
    },

    controllerLinkTooltip() {
      if ( this.controllerLinkDisabled ) {
        return this.t('kubewarden.monitoring.prerequisites.tooltips.prerequisites');
      }

      if ( !this.controllerChart ) {
        return this.t('kubewarden.monitoring.prerequisites.tooltips.chartError', { chart: 'Kubewarden Controller' }, true);
      }

      return null;
    },

    dashboardsTooltip() {
      if ( !this.monitoringApp ) {
        return this.t('kubewarden.monitoring.prerequisites.tooltips.appNotInstalled', { app: 'Rancher Monitoring' }, true);
      }

      if ( this.monitoringApp && isEmpty(this.cattleDashboardNs) ) {
        return this.t('kubewarden.monitoring.prerequisites.tooltips.nsNotFound');
      }

      return null;
    },

    dashboardButtonDisabled() {
      return (!this.monitoringApp ||
              isEmpty(this.cattleDashboardNs) ||
              (!this.hasKubewardenDashboards && !!this.conflictingGrafanaDashboards.length)
      );
    },

    hasKubewardenDashboards() {
      return !isEmpty(this.kubewardenDashboards);
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
        return this.t('kubewarden.monitoring.prerequisites.tooltips.chartError', { chart: 'Rancher Monitoring' }, true);
      }

      return null;
    },

    serviceMonitorButtonDisabled() {
      return (!this.controllerApp || !this.monitoringApp);
    },

    serviceMonitorsTooltip() {
      if ( !this.monitoringApp ) {
        return this.t('kubewarden.monitoring.prerequisites.tooltips.prerequisites');
      }

      if ( !this.kubewardenServiceMonitor && this.controllerApp ) {
        return this.t(
          'kubewarden.monitoring.prerequisites.tooltips.monitorsNotFound',
          { namespace: this.controllerApp.metadata?.namespace },
          true
        );
      }

      return null;
    },

    showConflictingDashboardsBanner() {
      return !this.hasKubewardenDashboards && !isEmpty(this.conflictingGrafanaDashboards);
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
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
        btnCb(false);
      }
    },

    async addServiceMonitor(btnCb) {
      try {
        await addKubewardenServiceMonitor({
          store:           this.$store,
          policyObj:       this.policyObj,
          policyServerObj: this.policyServerObj,
          controllerNs:    this.controllerApp?.metadata?.namespace,
          serviceMonitor:  this.kubewardenServiceMonitor
        });
        this.$emit('updateServiceMonitors');
        btnCb(true);
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
        btnCb(false);
      }
    },

    badgeIcon(prop) {
      if ( Array.isArray(prop) ) {
        const emptyProp = isEmpty(prop);

        return {
          'icon-dot-open': emptyProp, 'icon-checkmark': !emptyProp, 'text-success': !emptyProp
        };
      }

      return {
        'icon-dot-open': !prop, 'icon-checkmark': prop, 'text-success': prop
      };
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
      <div class="checklist__step mb-20" data-testid="kw-monitoring-checklist-step-open-tel">
        <i class="icon mr-10" :class="badgeIcon(openTelSvc)" />
        <p v-clean-html="t('kubewarden.tracing.openTelemetry', {}, true)" />
      </div>

      <div class="checklist__step mb-20" data-testid="kw-monitoring-checklist-step-monitoring-app">
        <i
          class="icon mr-10"
          :class="badgeIcon(monitoringApp)"
        />
        <div class="checklist__config">
          <p v-clean-html="t('kubewarden.monitoring.prerequisites.monitoringApp.label', {}, true)" p />
          <button
            v-if="!monitoringApp"
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

      <div class="checklist__step mb-20" data-testid="kw-monitoring-checklist-step-service-monitor-map">
        <i class="icon mr-10" :class="badgeIcon(kubewardenServiceMonitor)" />
        <div class="checklist__config">
          <p v-clean-html="t('kubewarden.monitoring.prerequisites.serviceMonitor.label', {}, true)" p />
          <AsyncButton
            v-if="!kubewardenServiceMonitor"
            v-clean-tooltip="serviceMonitorsTooltip"
            data-testid="kw-monitoring-checklist-step-service-monitor-button"
            mode="serviceMonitor"
            class="ml-10"
            :disabled="serviceMonitorButtonDisabled"
            @click="addServiceMonitor"
          />
        </div>
      </div>

      <div class="checklist__step mb-20" data-testid="kw-monitoring-checklist-step-config-map">
        <i class="icon mr-10" :class="badgeIcon(hasKubewardenDashboards)" />
        <div class="checklist__config">
          <p v-clean-html="t('kubewarden.monitoring.prerequisites.configMap.label', {}, true)" p />
          <AsyncButton
            v-if="!hasKubewardenDashboards"
            v-clean-tooltip="dashboardsTooltip"
            data-testid="kw-monitoring-checklist-step-config-map-button"
            mode="grafanaDashboard"
            class="ml-10"
            :disabled="dashboardButtonDisabled"
            @click="addDashboards"
          />
        </div>
      </div>
      <Banner
        v-if="showConflictingDashboardsBanner"
        color="error"
      >
        <div class="conflicting-banner">
          <p>
            {{ t('kubewarden.monitoring.prerequisites.configMap.conflictingDashboardsBanner', { count: conflictingGrafanaDashboards.length }, true) }}
          </p>
          <router-link
            v-for="configMap of conflictingGrafanaDashboards"
            :key="configMap.metadata.name"
            :to="configMap.detailLocation"
            class="text-bold"
          >
            {{ configMap.metadata.name }}
          </router-link>
        </div>
      </Banner>

      <div class="checklist__step mb-20" data-testid="kw-monitoring-checklist-step-controller-config">
        <i class="icon mr-10" :class="badgeIcon(metricsEnabled)" />
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

.conflicting-banner {
  display: flex;
  flex-direction: column;
}
</style>