<script>
import { mapGetters } from 'vuex';
import flatMap from 'lodash/flatMap';
import isEmpty from 'lodash/isEmpty';

import {
  _CREATE, CHART, REPO, REPO_TYPE, VERSION
} from '@shell/config/query-params';
import { monitoringStatus } from '@shell/utils/monitoring';
import { dashboardExists } from '@shell/utils/grafana';
import CreateEditView from '@shell/mixins/create-edit-view';

import { Banner } from '@components/Banner';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';

import { METRICS_DASHBOARD } from '../types';

import MetricsBanner from '../components/MetricsBanner';
import RulesTable from '../components/RulesTable';
import TraceTable from '../components/TraceTable';

export default {
  name: 'AdmissionPolicy',

  components: {
    Banner, DashboardMetrics, Loading, MetricsBanner, ResourceTabs, RulesTable, Tab, TraceTable
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },

    resource: {
      type:    String,
      default: null
    },

    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    // If monitoring is installed look for the dashboard for policies
    if ( this.monitoringStatus.installed ) {
      try {
        this.metricsProxy = await this.value.grafanaProxy(this.metricsType);

        if ( this.metricsProxy ) {
          this.metricsService = await dashboardExists(this.$store, this.currentCluster?.id, this.metricsProxy);
        }
      } catch (e) {
        console.error(`Error fetching Grafana service: ${ e }`); // eslint-disable-line no-console
      }
    } else {
      // If not we need to direct the user to install monitoring
      await this.$store.dispatch('catalog/load');

      // Check to see that the chart we need are available
      const charts = this.$store.getters['catalog/rawCharts'];
      const chartValues = Object.values(charts);

      const monitoringChart = chartValues.find(
        chart => chart.chartName === 'rancher-monitoring'
      );

      if ( monitoringChart ) {
        this.monitoringRoute = {
          name:   'c-cluster-apps-charts-install',
          params: {
            cluster:  this.$route.params.cluster,
            product:  this.$store.getters['productId'],
          },
          query: {
            [REPO_TYPE]: 'cluster',
            [REPO]:      'rancher-charts',
            [CHART]:     'rancher-monitoring',
            [VERSION]:   monitoringChart.versions[0]?.version,
          }
        };
      }
    }

    this.jaegerService = await this.value.jaegerService();
    this.traces = await this.value.jaegerProxy() || [];

    if ( this.traces.length > 1 ) {
      this.traces = flatMap(this.traces);
    }
  },

  data() {
    return {
      jaegerService:   null,
      metricsProxy:    null,
      metricsService:  null,
      monitoringRoute: null,
      reloadRequired:  false,
      traces:          null,

      metricsType: METRICS_DASHBOARD.POLICY
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    dashboardVars() {
      const id = this.value?.id.replace('/', '-'); // prometheus needs `namespaced-<namespace>-<id>` not `namespaced-<namespace>/<id>`

      return { policy_name: `namespaced-${ id }` };
    },

    emptyTraces() {
      if ( this.traces ) {
        return !this.traces.find(t => t.data.length);
      }

      return true;
    },

    hasRelationships() {
      return !!this.value.metadata?.relationships;
    },

    hasRules() {
      return !isEmpty(this.rulesRows[0]);
    },

    rulesRows() {
      return this.value.spec?.rules;
    },

    tracesRows() {
      return this.value.traceTableRows(this.traces);
    }
  },

  methods: {
    async addDashboard(btnCb) {
      try {
        await this.value.addGrafanaDashboard(this.metricsType);
        btnCb(true);

        this.reloadRequired = true;
      } catch (err) {
        this.errors = err;
        btnCb(false);
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="mb-20">
      <h3>{{ t('namespace.resources') }}</h3>
    </div>
    <ResourceTabs v-model="value" :mode="mode" :need-related="hasRelationships">
      <Tab v-if="hasRules" name="policy-rules" label="Rules" :weight="99">
        <RulesTable :rows="rulesRows" />
      </Tab>

      <Tab name="policy-tracing" label="Tracing" :weight="98">
        <TraceTable :rows="tracesRows">
          <template #traceBanner>
            <Banner v-if="emptyTraces" color="warning">
              <span v-if="!jaegerService" v-html="t('kubewarden.tracing.noJaeger', {}, true)" />
              <span v-else>{{ t('kubewarden.tracing.noTraces') }}</span>
            </Banner>
          </template>
        </TraceTable>
      </Tab>

      <Tab name="policy-metrics" label="Metrics" :weight="97">
        <MetricsBanner
          v-if="!monitoringStatus.installed || !metricsService"
          :metrics-service="metricsService"
          :metrics-type="metricsType"
          :monitoring-route="monitoringRoute"
          :reload-required="reloadRequired"
          @add="addDashboard"
        />

        <template v-if="metricsService" #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="metricsProxy"
            :summary-url="metricsProxy"
            :vars="dashboardVars"
            graph-height="825px"
          />
        </template>
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.sub-row {
  background-color: var(--body-bg);
  border-bottom: 1px solid var(--sortable-table-top-divider);
  padding-left: 1rem;
  padding-right: 1rem;
}

.details {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 1em;

  .col {
    display: flex;
    flex-direction: column;

    section {
      margin-bottom: 1.5rem;
    }

    .title {
      color: var(--muted);
      margin-bottom: 0.5rem;
    }
  }
}
</style>
