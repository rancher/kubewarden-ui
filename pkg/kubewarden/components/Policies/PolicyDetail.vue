<script>
import { mapGetters } from 'vuex';
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

import { METRICS_DASHBOARD } from '../../types';

import MetricsBanner from '../MetricsBanner';
import RulesTable from '../RulesTable';
import TraceTable from '../TraceTable';

export default {
  name: 'PolicyDetail',

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
    }

    this.jaegerService = await this.value.jaegerService();

    if ( this.jaegerService ) {
      this.filteredValidations = await this.value.jaegerSpecificValidations({ service: this.jaegerService });
    }
  },

  data() {
    return {
      jaegerService:       null,
      metricsProxy:        null,
      metricsService:      null,
      reloadRequired:      false,
      filteredValidations: null,

      metricsType: METRICS_DASHBOARD.POLICY
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    dashboardVars() {
      return { policy_name: `clusterwide-${ this.value?.id }` };
    },

    emptyTraces() {
      if ( isEmpty(this.filteredValidations) ) {
        return true;
      }

      return false;
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
      if ( this.filteredValidations ) {
        return this.value.traceTableRows(this.filteredValidations);
      }

      return [];
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
