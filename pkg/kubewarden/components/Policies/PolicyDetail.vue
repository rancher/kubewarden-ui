<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { _CREATE } from '@shell/config/query-params';
import { monitoringStatus } from '@shell/utils/monitoring';
import CreateEditView from '@shell/mixins/create-edit-view';

import Markdown from '@shell/components/Markdown';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';

import { ARTIFACTHUB_PKG_ANNOTATION } from '@kubewarden/types';

import MetricsTab from '@kubewarden/components/MetricsTab';
import RulesTable from '@kubewarden/components/RulesTable';
import TraceTable from '@kubewarden/components/TraceTable';

export default {
  name: 'PolicyDetail',

  components: {
    Markdown,
    MetricsTab,
    ResourceTabs,
    RulesTable,
    Tab,
    TraceTable
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
      type:    Object,
      default: () => {},
    },
  },

  async mounted() {
    if (this.value?.metadata?.annotations?.[ARTIFACTHUB_PKG_ANNOTATION]) {
      try {
        const artifactHubPackage = await this.value.artifactHubPackageVersion();

        if (artifactHubPackage && !artifactHubPackage.error && artifactHubPackage.readme) {
          this.policyReadme = JSON.parse(JSON.stringify(artifactHubPackage.readme));
        }
      } catch (e) {
        console.warn(`Unable to fetch artifacthub package: ${ e }`);
      }
    }
  },

  data() {
    return { policyReadme: null };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    dashboardVars() {
      return { policy_name: `clusterwide-${ this.value?.id }` };
    },

    hasRelationships() {
      return !!this.value?.metadata?.relationships;
    },

    hasRules() {
      return !isEmpty(this.rulesRows?.[0]);
    },

    rulesRows() {
      return this.value?.spec?.rules;
    }
  }
};
</script>

<template>
  <div>
    <div class="mb-20">
      <h3>{{ t('namespace.resources') }}</h3>
    </div>
    <ResourceTabs :value="value" data-testid="kw-policy-detail-tabs" :mode="mode" :need-related="hasRelationships">
      <Tab v-if="policyReadme" name="policy-readme" label="Readme" :weight="99">
        <Markdown v-model:value="policyReadme" data-testid="kw-policy-detail-readme" />
      </Tab>

      <Tab v-if="hasRules" name="policy-rules" label="Rules" :weight="98">
        <RulesTable :rows="rulesRows" data-testid="kw-policy-detail-rules-table" />
      </Tab>

      <Tab name="policy-tracing" label="Tracing" :weight="97">
        <TraceTable :resource="resource" :policy="value" data-testid="kw-policy-detail-trace-table" />
      </Tab>

      <Tab #default="props" name="policy-metrics" label="Metrics" :weight="96">
        <MetricsTab :resource="resource" :policy-obj="value" :active="props.active" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
