<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { _CREATE } from '@shell/config/query-params';
import { allHash } from '@shell/utils/promise';
import CreateEditView from '@shell/mixins/create-edit-view';
import { mapPref, GROUP_RESOURCES } from '@shell/store/prefs';

import { BadgeState } from '@components/BadgeState';
import CountGauge from '@shell/components/CountGauge';
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import ResourceTable from '@shell/components/ResourceTable';
import Tab from '@shell/components/Tabbed/Tab';

import { RELATED_HEADERS } from '@kubewarden/config/table-headers';
import { KUBEWARDEN } from '@kubewarden/types';

import MetricsTab from '@kubewarden/components/MetricsTab';
import TraceTable from '@kubewarden/components/TraceTable';

export default {
  name: 'PolicyServer',

  components: {
    BadgeState,
    CountGauge,
    Loading,
    MetricsTab,
    ResourceTabs,
    ResourceTable,
    Tab,
    TraceTable
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
    const hash = await allHash({
      relatedPolicies:      this.value.allRelatedPolicies(),
      policyGauges:         this.value.policyGauges()
    });

    const assignIfNotEmpty = (prop, value) => {
      if (!isEmpty(value)) {
        this[prop] = value;
      }
    };

    assignIfNotEmpty('relatedPolicies', hash.relatedPolicies);
    assignIfNotEmpty('policyGauges', hash.policyGauges);
  },

  data() {
    return {
      RELATED_HEADERS,
      policyGauges:         null,
      relatedPolicies:      null,
      reloadRequired:       false,
      resource:             KUBEWARDEN.POLICY_SERVER
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ policyTraces: 'kubewarden/policyTraces' }),
    _group: mapPref(GROUP_RESOURCES),

    filteredTraces() {
      if (!isEmpty(this.policyTraces)) {
        return this.policyTraces.filter((policyTraceObj) => {
          if (this.currentCluster?.id === policyTraceObj.cluster) {
            return policyTraceObj;
          }
        });
      }

      return null;
    },

    emptyTraces() {
      return isEmpty(this.filteredTraces);
    },

    groupPreference() {
      const out = this._group === 'namespace' ? 'kind' : null;

      return out;
    },

    relatedPoliciesTotal() {
      if (isEmpty(this.relatedPolicies)) {
        return 0;
      }

      return this.relatedPolicies.length;
    },

    tracesGauges() {
      if (!this.emptyTraces) {
        return this.value.tracesGauges(this.filteredTraces);
      }

      return null;
    },

    traceGaugeTotals() {
      if (!this.emptyTraces) {
        return this.filteredTraces?.flatMap((policyTraceObj) => policyTraceObj.traces).length;
      }

      return 0;
    }
  },

  methods: {
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
            <h3 data-testid="kw-ps-detail-status-title">
              {{ t('kubewarden.policyServer.policyGauge.byStatus') }}
            </h3>
            <div class="gauges mb-20">
              <CountGauge
                v-for="(group, key) in policyGauges"
                :key="key"
                :total="relatedPoliciesTotal"
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
                :useful="group.count || 0"
                :total="traceGaugeTotals"
                :graphical="false"
                :primary-color-var="`--sizzle-${group.color}`"
                :name="key"
              />
            </div>
          </div>
        </template>
      </div>
    </template>

    <ResourceTabs :value="value" :mode="mode">
      <Tab name="related-policies" label="Policies" :weight="99">
        <template #default>
          <ResourceTable
            :rows="relatedPolicies || []"
            :headers="RELATED_HEADERS"
            :groupable="true"
            :group-by="groupPreference"
            :table-actions="true"
            :use-query-params-for-simple-filtering="true"
            data-testid="kw-ps-detail-related-policies-list"
          >
            <template #col:operation="{ row }">
              <td>
                <BadgeState
                  :data-testid="`kw-ps-detail-${ row.id }-state`"
                  :label="row.operation"
                  :color="color(row.operation)"
                />
              </td>
            </template>
          </ResourceTable>
        </template>
      </Tab>

      <Tab name="policy-tracing" label="Tracing" :weight="98" class="relative">
        <TraceTable :resource="resource" :related-policies="relatedPolicies" />
      </Tab>

      <Tab #default="props" name="policy-metrics" label="Metrics" :weight="97" class="relative">
        <MetricsTab :resource="resource" :policy-server-obj="value" :active="props.active" />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.relative {
  position: relative;
}

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
