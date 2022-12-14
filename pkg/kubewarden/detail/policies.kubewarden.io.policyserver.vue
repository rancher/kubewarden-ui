<script>
import { mapGetters } from 'vuex';
import {
  _CREATE, CHART, REPO, REPO_TYPE, VERSION
} from '@shell/config/query-params';
import { dashboardExists } from '@shell/utils/grafana';
import { monitoringStatus } from '@shell/utils/monitoring';
import CreateEditView from '@shell/mixins/create-edit-view';

import { Banner } from '@components/Banner';
import CountGauge from '@shell/components/CountGauge';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import ResourceTable from '@shell/components/ResourceTable';
import Tab from '@shell/components/Tabbed/Tab';

import { isEmpty } from 'lodash';
import { METRICS_DASHBOARD, RELATED_HEADERS } from '../types';

import MetricsBanner from '../components/MetricsBanner';
import TraceTable from '../components/TraceTable';

export default {
  name: 'PolicyServer',

  components: {
    Banner, CountGauge, DashboardMetrics, Loading, MetricsBanner, ResourceTabs, ResourceTable, Tab, TraceTable
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },

    value: {
      type:     Object,
      required: true,
    }
  },

  async fetch() {
    this.relatedPolicies = await this.value.allRelatedPolicies();
    this.policyGauges = await this.value.policyGauges();

    // If monitoring is installed look for the dashboard for PolicyServers
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

    if ( !isEmpty(this.relatedPolicies) && this.jaegerService ) {
      this.filteredValidations = await this.value.filteredValidations({ service: this.jaegerService });
    }
  },

  data() {
    return {
      RELATED_HEADERS,
      jaegerService:       null,
      filteredValidations: null,
      metricsProxy:        null,
      metricsService:      null,
      monitoringRoute:     null,
      policyGauges:        null,
      relatedPolicies:     null,
      reloadRequired:      false,

      metricsType: METRICS_DASHBOARD.POLICY_SERVER
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    emptyTraces() {
      return isEmpty(this.filteredValidations);
    },

    tracesGauges() {
      if ( !this.emptyTraces ) {
        return this.value.tracesGauges(this.filteredValidations);
      }

      return null;
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
    },

    hasNamespaceSelector(row) {
      return row.namespaceSelector;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <template v-if="policyGauges">
      <div class="row">
        <template>
          <div class="col span-6">
            <h3>
              {{ t('kubewarden.policyServer.policyGauge.byStatus') }}
            </h3>
            <div class="gauges mb-20">
              <CountGauge
                v-for="(group, key) in policyGauges"
                :key="key"
                :total="relatedPolicies.length"
                :useful="group.count || 0"
                :graphical="false"
                :primary-color-var="`--sizzle-${group.color}`"
                :name="key"
              />
            </div>
          </div>
        </template>
        <template v-if="!emptyTraces">
          <div class="col span-6">
            <h3>
              {{ t('kubewarden.policyServer.policyGauge.traces') }}
            </h3>
            <div class="gauges mb-20">
              <CountGauge
                v-for="(group, key) in tracesGauges"
                :key="key"
                :total="filteredValidations.length"
                :useful="group.count || 0"
                :graphical="false"
                :primary-color-var="`--sizzle-${group.color}`"
                :name="key"
              />
            </div>
          </div>
        </template>
      </div>
    </template>

    <ResourceTabs v-model="value" :mode="mode">
      <Tab name="related-policies" label="Policies" :weight="99">
        <template #default>
          <ResourceTable
            :rows="relatedPolicies"
            :headers="RELATED_HEADERS"
            :groupable="true"
            group-by="kind"
            :table-actions="true"
          >
            <template #col:operation="{ row }">
              <td>
                <BadgeState
                  :label="row.operation"
                  :color="color(row.operation)"
                />
              </td>
            </template>
          </ResourceTable>
        </template>
      </Tab>

      <Tab name="policy-metrics" label="Metrics" :weight="98">
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
            graph-height="825px"
          />
        </template>
      </Tab>

      <Tab name="policy-tracing" label="Tracing" :weight="97">
        <template>
          <TraceTable
            :rows="filteredValidations"
          >
            <template #traceBanner>
              <Banner v-if="emptyTraces" color="warning">
                <span v-if="!jaegerService" v-html="t('kubewarden.tracing.noJaeger', {}, true)" />
                <span v-else>{{ t('kubewarden.tracing.noRelatedTraces') }}</span>
              </Banner>
            </template>
          </TraceTable>
        </template>
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.policy {
  &__mode {
    display: flex;
    align-items: center;

    i {
      margin-left: 5px;
      font-size: 22px;
      color: var(--warning);
    }
  }
}

.gaugesContainer {
  display: flex;
}

.gauges {
  display: flex;
  justify-content: space-around;

  flex-wrap: wrap;
  justify-content: left;

  .count-gauge {
    width: 46%;
    margin-bottom: 10px;
    flex: initial;
  }

  & > *{
    flex: 1;
    margin-right: $column-gutter;
  }
}
</style>
