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

import { KUBEWARDEN, KUBEWARDEN_CHARTS, KubewardenDashboardLabels, KubewardenDashboards } from '@kubewarden/types';
import { handleGrowl } from '@kubewarden/utils/handle-growl';
import { refreshCharts } from '@kubewarden/utils/chart';
import { grafanaProxy } from '@kubewarden/modules/grafana';
import { findServiceMonitor, isServiceMonitorOutOfDate } from '@kubewarden/modules/metricsConfig';
import { jaegerPolicyName } from '@kubewarden/modules/jaegerTracing';
import { findPolicyServerResource } from '@kubewarden/modules/policyServer';

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
    Banner,
    DashboardMetrics,
    Loading,
    MetricsChecklist
  },

  mixins: [ResourceFetch],

  async fetch() {
    this.debouncedRefreshCharts = debounce((init = false) => {
      refreshCharts({
        store:     this.$store,
        chartName: 'rancher-monitoring',
        init
      });
    }, 500);

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
      },
    ];
    const hash = [];

    // Check if the resources are already stored with their respective getters before fetching
    for (const resource of resourceMap) {
      if (isEmpty(resource.property) && this.$store.getters['cluster/canList'](resource.name)) {
        hash.push(this.$fetchType(resource.name));
      }
    }

    await allHash(hash);

    if (this.showChecklist && !this.monitoringChart) {
      this.debouncedRefreshCharts(true);
    }

    // If monitoring is installed look for the dashboard based on the METRICS_TYPE
    if (this.monitoringStatus.installed) {
      try {
        this.metricsProxy = await grafanaProxy({
          store: this.$store,
          type:  this.METRICS_TYPE
        });

        if (this.metricsProxy) {
          this.metricsService = await dashboardExists('v2', this.$store, this.currentCluster?.id, this.metricsProxy);
        }
      } catch (e) {
        const error = {
          _statusText: 'Error',
          message:     `Error fetching Grafana Service: ${ e }`
        };

        handleGrowl({
          error,
          store: this.$store
        });
      }
    }

    if (this.controllerApp) {
      await this.controllerApp.fetchValues(true);
    }
  },

  data() {
    const METRICS_TYPE = this.resource === KUBEWARDEN.POLICY_SERVER ? KubewardenDashboards.POLICY_SERVER : KubewardenDashboards.POLICY;

    return {
      METRICS_TYPE,

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
      if (!this.metricsProxy) {
        this.metricsProxy = await grafanaProxy({
          store: this.$store,
          type:  this.METRICS_TYPE
        });

        if (this.metricsProxy) {
          this.metricsService = await dashboardExists('v2', this.$store, this.currentCluster?.id, this.metricsProxy);
        }
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
      return this.allNamespaces?.find((ns) => ns?.metadata?.name === 'cattle-dashboards');
    },

    conflictingGrafanaDashboards() {
      return this.allConfigMaps?.filter((configMap) => {
        const name = configMap?.metadata?.name;

        if (name) {
          return name === KubewardenDashboards.POLICY_SERVER || name === KubewardenDashboards.POLICY;
        }
      });
    },

    controllerApp() {
      return this.allApps?.find((app) => app?.spec?.chart?.metadata?.name === KUBEWARDEN_CHARTS.CONTROLLER);
    },

    controllerChart() {
      return this.charts?.find((chart) => chart.chartName === KUBEWARDEN_CHARTS.CONTROLLER);
    },

    grafanaService() {
      const monitoringServices = this.allServices?.filter((svc) => svc?.metadata?.labels?.['app.kubernetes.io/instance'] === 'rancher-monitoring');

      return monitoringServices?.find((svc) => svc?.metadata?.labels?.['app.kubernetes.io/name'] === 'grafana');
    },

    kubewardenGrafanaDashboards() {
      return this.allConfigMaps?.filter((configMap) => configMap?.metadata?.labels?.[KubewardenDashboardLabels.DASHBOARD]);
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
      if (!this.controllerApp) {
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
          this.handleMetricsChecklist('unsupportedTelemetrySpec', true);

          return null;
        }

        // If metrics is not undefined or boolean, it's outdated
        if (!metricsIsUndefinedOrBoolean) {
          this.handleMetricsChecklist('outdatedTelemetrySpec', true);

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
      return this.allApps?.find((app) => app?.spec?.chart?.metadata?.name === 'rancher-monitoring');
    },

    monitoringChart() {
      return this.charts?.find((chart) => chart.chartName === 'rancher-monitoring');
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
      if (this.allServices) {
        return this.allServices.filter((svc) => svc?.metadata?.labels?.[KUBERNETES.MANAGED_NAME] === 'opentelemetry-operator');
      }

      return null;
    },

    openTelSvc() {
      if (!isEmpty(this.openTelemetryServices)) {
        return this.openTelemetryServices.find((svc) => {
          const ports = svc?.spec?.ports;

          if (ports.length) {
            return ports.find((p) => p.port === 8080);
          }
        });
      }

      return null;
    },

    policyServerSvcs() {
      if (!isEmpty(this.allPolicyServers)) {
        const policyServerNames = this.allPolicyServers
          .map((ps) => ps?.metadata?.name)
          .filter(Boolean);

        const out = policyServerNames.map((name) => findPolicyServerResource(this.allServices, name));

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
    <MetricsChecklist
      v-if="showChecklist"
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

    <template v-if="!showChecklist">
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
