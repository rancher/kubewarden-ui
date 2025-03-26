<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';
import semver from 'semver';

import {
  CATALOG, CONFIG_MAP, MONITORING, NAMESPACE, SERVICE
} from '@shell/config/types';
import { KUBERNETES } from '@shell/config/labels-annotations';
import { dashboardExists } from '@shell/utils/grafana';
import { monitoringStatus } from '@shell/utils/monitoring';
import { allHash } from '@shell/utils/promise';
import ResourceFetch from '@shell/mixins/resource-fetch';

import DashboardMetrics from '@shell/components/DashboardMetrics';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';

import { KUBEWARDEN, KUBEWARDEN_CHARTS, KubewardenDashboardLabels, KubewardenDashboards } from '../types';
import { isAdminUser } from '../utils/permissions';
import { handleGrowl } from '../utils/handle-growl';
import { refreshCharts } from '../utils/chart';
import { grafanaProxy } from '../modules/grafana';
import { findServiceMonitor, isServiceMonitorOutOfDate } from '../modules/metricsConfig';
import { jaegerPolicyName } from '../modules/jaegerTracing';
import { findPolicyServerResource } from '../modules/policyServer';

import MetricsChecklist from './MetricsChecklist';

export default {
  props: {
    active: {
      type:    Boolean,
      default: null
    },
    resource: {
      type:    String,
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

  components: {
    Banner, DashboardMetrics, Loading, MetricsChecklist
  },

  mixins: [ResourceFetch],

  async fetch() {
    await this.fetchData();
  },

  data() {
    const METRICS_TYPE = this.resource === KUBEWARDEN.POLICY_SERVER ? KubewardenDashboards.POLICY_SERVER : KubewardenDashboards.POLICY;

    return {
      METRICS_TYPE,

      isAdminUser: false,
      permissions: {
        policyServer:   false,
        app:            false,
        clusterRepo:    false,
        configMap:      false,
        serviceMonitor: false,
        namespace:      false,
        service:        false
      },

      [CATALOG.APP]:               null,
      [CATALOG.CLUSTER_REPO]:      null,
      [CONFIG_MAP]:                null,
      [MONITORING.SERVICEMONITOR]: null,
      [SERVICE]:                   null,
      metricsProxy:                null,
      metricsService:              null,
      debouncedRefreshCharts:      null,
      outdatedTelemetrySpec:       false,
      unsupportedTelemetrySpec:    false
    };
  },

  watch: {
    async grafanaService() {
      if ( !this.metricsProxy ) {
        this.metricsProxy = await grafanaProxy({ store: this.$store, type: this.METRICS_TYPE });

        if ( this.metricsProxy ) {
          this.metricsService = await dashboardExists('v2', this.$store, this.currentCluster?.id, this.metricsProxy);
        }
      }
    },

    async controllerApp() {
      if (this.controllerApp) {
        await this.controllerApp.fetchValues(true);
      }
    }
  },

  computed: {
    ...mapGetters(['currentCluster', 'productId']),
    ...mapGetters({ charts: 'catalog/charts' }),
    ...monitoringStatus(),

    policyName() {
      return jaegerPolicyName(this.policyObj);
    },

    allApps() {
      return this.$store.getters['cluster/all'](CATALOG.APP);
    },

    allRepos() {
      return this.$store.getters['cluster/all'](CATALOG.CLUSTER_REPO);
    },

    allConfigMaps() {
      return this.$store.getters['cluster/all'](CONFIG_MAP);
    },

    allNamespaces() {
      return this.$store.getters['cluster/all'](NAMESPACE);
    },

    allPolicyServers() {
      return this.$store.getters['cluster/all'](KUBEWARDEN.POLICY_SERVER);
    },

    allServiceMonitors() {
      return this.$store.getters['cluster/all'](MONITORING.SERVICEMONITOR);
    },

    allServices() {
      return this.$store.getters['cluster/all'](SERVICE);
    },

    cattleDashboardNs() {
      return this.allNamespaces?.find(ns => ns?.metadata?.name === 'cattle-dashboards');
    },

    conflictingGrafanaDashboards() {
      return this.allConfigMaps?.filter((configMap) => {
        const name = configMap?.metadata?.name;

        if ( name ) {
          return name === KubewardenDashboards.POLICY_SERVER || name === KubewardenDashboards.POLICY;
        }
      });
    },

    controllerApp() {
      return this.allApps?.find(app => app?.spec?.chart?.metadata?.name === KUBEWARDEN_CHARTS.CONTROLLER);
    },

    controllerChart() {
      return this.charts?.find(chart => chart.chartName === KUBEWARDEN_CHARTS.CONTROLLER);
    },

    grafanaService() {
      const monitoringServices = this.allServices?.filter(svc => svc?.metadata?.labels?.['app.kubernetes.io/instance'] === 'rancher-monitoring');

      return monitoringServices?.find(svc => svc?.metadata?.labels?.['app.kubernetes.io/name'] === 'grafana');
    },

    hasAvailability() {
      return this.isAdminUser || Object.values(this.permissions).every((value) => value);
    },

    kubewardenGrafanaDashboards() {
      return this.allConfigMaps?.filter(configMap => configMap?.metadata?.labels?.[KubewardenDashboardLabels.DASHBOARD]);
    },

    kubewardenServiceMonitor() {
      return findServiceMonitor({
        policyObj:          this.policyObj,
        policyServerObj:    this.policyServerObj,
        controllerNs:       this.controllerApp?.metadata?.namespace,
        allServiceMonitors: this.allServiceMonitors
      });
    },

    metricsConfiguration() {
      if (!this.controllerApp?.values) {
        return null;
      }

      const version = this.controllerApp?.spec?.chart?.metadata?.version;
      const telemetry = this.controllerApp?.values?.telemetry;

      if (semver.gte(version, '4.0.0-0')) {
        // In version 4+, telemetry.metrics should be boolean or undefined (treated as false).
        // sidecar.metrics is only meaningful if telemetry.metrics === true.
        const metricsIsUndefinedOrBoolean = telemetry?.metrics === undefined || typeof telemetry?.metrics === 'boolean';

        // Check for unsupported 'custom' mode
        if (telemetry?.mode === 'custom') {
          this.unsupportedTelemetrySpec = true;

          return null;
        }

        // If metrics is not undefined or boolean, it's outdated
        if (!metricsIsUndefinedOrBoolean) {
          this.outdatedTelemetrySpec = true;

          return null;
        }

        // If telemetry.metrics is undefined or false, treat it as false.
        // sidecar config is irrelevant in that case, and not considered outdated.
        if (telemetry?.metrics !== true) {
          // metrics is off, no sidecar config needed
          return null;
        }

        // If we get here, telemetry.metrics === true and portIsDefined === true
        return telemetry?.metrics;
      } else {
        // Old schema: just return telemetry.metrics.enabled
        return telemetry?.metrics?.enabled;
      }
    },

    monitoringApp() {
      return this.allApps?.find(app => app?.spec?.chart?.metadata?.name === 'rancher-monitoring');
    },

    monitoringChart() {
      return this.charts?.find(chart => chart.chartName === 'rancher-monitoring');
    },

    outdatedServiceMonitor() {
      const sm = this.kubewardenServiceMonitor;
      const ps = this.policyServerObj;

      if (!sm || !ps) {
        return false;
      }

      return isServiceMonitorOutOfDate(ps, sm);
    },

    openTelemetryServices() {
      if ( this.allServices ) {
        return this.allServices.filter(svc => svc?.metadata?.labels?.[KUBERNETES.MANAGED_NAME] === 'opentelemetry-operator');
      }

      return null;
    },

    openTelSvc() {
      if ( !isEmpty(this.openTelemetryServices) ) {
        return this.openTelemetryServices.find((svc) => {
          const ports = svc?.spec?.ports;

          if ( ports.length ) {
            return ports.find(p => p.port === 8080);
          }
        });
      }

      return null;
    },

    policyServerSvcs() {
      if ( !isEmpty(this.allPolicyServers) ) {
        const policyServerNames = this.allPolicyServers.map(ps => ps?.metadata?.name);
        const out = [];

        for ( const ps of policyServerNames ) {
          out.push(this.allServices?.find(svc => svc?.metadata?.labels?.app === `kubewarden-policy-server-${ ps }`));
        }

        return out;
      }

      return null;
    },

    showChecklist() {
      const missingDependencies = [
        !this.openTelSvc,
        !this.monitoringApp,
        !this.kubewardenServiceMonitor,
        !this.metricsConfiguration,
        !this.kubewardenGrafanaDashboards || isEmpty(this.kubewardenGrafanaDashboards),
        this.outdatedServiceMonitor
      ];

      return missingDependencies.some(Boolean);
    }
  },

  methods: {
    async fetchData() {
      this.setAdminUser();
      this.setPermissions();
      this.initDebouncedRefreshCharts();
      await this.fetchResourcesData();
      this.refreshChartsIfNeeded();
      await this.handleGrafanaDashboard();
      await this.fetchControllerAppValues();
    },

    setAdminUser() {
      // Determine if the current user is an admin.
      this.isAdminUser = isAdminUser(this.$store.getters);
    },

    setPermissions() {
      // Map resource types to their respective keys.
      const types = {
        policyServer:   { type: KUBEWARDEN.POLICY_SERVER },
        app:            { type: CATALOG.APP },
        clusterRepo:    { type: CATALOG.CLUSTER_REPO },
        configMap:      { type: CONFIG_MAP },
        serviceMonitor: { type: MONITORING.SERVICEMONITOR },
        namespace:      { type: NAMESPACE },
        service:        { type: SERVICE }
      };

      // Set permissions based on store getters.
      Object.entries(types).forEach(([key, value]) => {
        if (this.$store.getters['cluster/canList'](value)) {
          this.permissions[key] = true;
        }
      });
    },

    initDebouncedRefreshCharts() {
      // Create a debounced function for refreshing charts.
      this.debouncedRefreshCharts = debounce((init = false) => {
        refreshCharts({
          store:     this.$store,
          chartName: 'rancher-monitoring',
          init
        });
      }, 500);
    },

    async fetchResourcesData() {
      // Define the mapping of resource names to their stored properties.
      const resourceMap = [
        {
          name:     CATALOG.APP,
          property: this.allApps
        },
        {
          name:     CATALOG.CLUSTER_REPO,
          property: this.allRepos
        },
        {
          name:     CONFIG_MAP,
          property: this.allConfigMaps
        },
        {
          name:     KUBEWARDEN.POLICY_SERVER,
          property: this.allPolicyServers
        },
        {
          name:     MONITORING.SERVICEMONITOR,
          property: this.allServiceMonitors
        },
        {
          name:     NAMESPACE,
          property: this.allNamespaces
        },
        {
          name:     SERVICE,
          property: this.allServices
        }
      ];

      // Collect resource fetch promises if the property is empty and listing is allowed.
      const promises = resourceMap.reduce((acc, resource) => {
        if (isEmpty(resource.property) && this.$store.getters['cluster/canList'](resource.name)) {
          acc.push(this.$fetchType(resource.name));
        }

        return acc;
      }, []);

      await allHash(promises);
    },

    refreshChartsIfNeeded() {
      // Refresh charts if the checklist is shown and no monitoring chart exists.
      if (this.showChecklist && !this.monitoringChart) {
        this.debouncedRefreshCharts(true);
      }
    },

    async handleGrafanaDashboard() {
      if (this.monitoringStatus.installed) {
        try {
          this.metricsProxy = await grafanaProxy({
            store: this.$store,
            type:  this.METRICS_TYPE
          });

          if (this.metricsProxy) {
            this.metricsService = await dashboardExists(
              'v2',
              this.$store,
              this.currentCluster?.id,
              this.metricsProxy
            );
          }
        } catch (error) {
          handleGrowl({
            error: {
              _statusText: 'Error',
              message:     `Error fetching Grafana Service: ${ error }`
            },
            store: this.$store
          });
        }
      }
    },

    async fetchControllerAppValues() {
      if (this.controllerApp) {
        await this.controllerApp.fetchValues(true);
      }
    },

    async updateServiceMonitors() {
      await this.$fetchType(MONITORING.SERVICEMONITOR);
    },

    async updateServiceMonitorLabels() {
      await this.$fetchType(MONITORING.SERVICEMONITOR);
      this.outdatedServiceMonitor = false;
    },

    handleMetricsChecklist(prop, val) {
      this[prop] = val;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else>
    <Banner
        v-if="!hasAvailability"
        color="error"
        class="mt-20 mb-20"
        data-testid="kw-unavailability-banner"
        :label="t('kubewarden.unavailability.banner', { type: t('kubewarden.unavailability.type.metricsDashboard') })"
      />

      <MetricsChecklist
        v-else-if="showChecklist"
        :cattle-dashboard-ns="cattleDashboardNs"
        :conflicting-grafana-dashboards="conflictingGrafanaDashboards"
        :controller-app="controllerApp"
        :controller-chart="controllerChart"
        :kubewarden-service-monitor="kubewardenServiceMonitor"
        :kubewarden-dashboards="kubewardenGrafanaDashboards"
        :metrics-configuration="metricsConfiguration"
        :monitoring-app="monitoringApp"
        :monitoring-chart="monitoringChart"
        :open-tel-svc="openTelSvc"
        :policy-obj="policyObj"
        :policy-server-obj="policyServerObj"
        :outdated-telemetry-spec="outdatedTelemetrySpec"
        :unsupported-telemetry-spec="unsupportedTelemetrySpec"
        :outdated-service-monitor="outdatedServiceMonitor"
        @updateServiceMonitors="updateServiceMonitors"
        @updateServiceMonitorLabels="updateServiceMonitorLabels"
      />

    <template v-else>
      <Banner
        v-if="monitoringApp && !metricsProxy"
        color="error"
        :label="t('kubewarden.monitoring.warning.noProxy')"
      />
      <DashboardMetrics
        v-if="metricsProxy && active"
        data-testid="kw-ps-metrics-dashboard"
        :detail-url="metricsProxy"
        :summary-url="metricsProxy"
        :vars="{'policy_name': policyName}"
        graph-height="825px"
      />
    </template>
  </div>
</template>