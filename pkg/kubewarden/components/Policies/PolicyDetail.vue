<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { _CREATE } from '@shell/config/query-params';
import { monitoringStatus } from '@shell/utils/monitoring';
import CreateEditView from '@shell/mixins/create-edit-view';

import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';

import MetricsTab from '../MetricsTab';
import RulesTable from '../RulesTable';
import TraceTable from '../TraceTable';

export default {
  name: 'PolicyDetail',

  components: {
    MetricsTab, ResourceTabs, RulesTable, Tab, TraceTable
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

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    dashboardVars() {
      return { policy_name: `clusterwide-${ this.value?.id }` };
    },

    hasRelationships() {
      return !!this.value.metadata?.relationships;
    },

    hasRules() {
      return !isEmpty(this.rulesRows[0]);
    },

    rulesRows() {
      return this.value.spec?.rules;
    }
  }
};
</script>

<template>
  <div>
    <div class="mb-20">
      <h3>{{ t('namespace.resources') }}</h3>
    </div>
    <ResourceTabs v-model="value" data-testid="kw-policy-detail-tabs" :mode="mode" :need-related="hasRelationships">
      <Tab v-if="hasRules" name="policy-rules" label="Rules" :weight="99">
        <RulesTable data-testid="kw-polity-detail-rules-table" :rows="rulesRows" />
      </Tab>

      <Tab name="policy-tracing" label="Tracing" :weight="98">
        <TraceTable :resource="resource" :policy="value" data-testid="kw-policy-detail-trace-table" />
      </Tab>

      <Tab #default="props" name="policy-metrics" label="Metrics" :weight="97">
        <MetricsTab :resource="resource" :policy-obj="value" :active="props.active" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
