<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { CATALOG, SERVICE } from '@shell/config/types';
import { KUBERNETES } from '@shell/config/labels-annotations';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { allHash } from '@shell/utils/promise';

import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import SortableTable from '@shell/components/SortableTable';

import { TRACE_HEADERS } from '../config/table-headers';
import { KUBEWARDEN, KUBEWARDEN_CHARTS, MODE_MAP, OPERATION_MAP } from '../types';
import { jaegerTraces } from '../modules/jaegerTracing';
import { formatDuration } from '../utils/duration-format';

import TraceChecklist from './TraceChecklist';

dayjs.extend(relativeTime);

export default {
  props: {
    resource: {
      type:     String,
      required: true
    },
    relatedPolicies: {
      type:    Array,
      default: () => []
    },
    policy: {
      type:    Object,
      default: () => {}
    }
  },

  components: {
    BadgeState, Banner, Loading, SortableTable, TraceChecklist
  },

  mixins: [ResourceFetch],

  async fetch() {
    const types = [CATALOG.APP, CATALOG.CLUSTER_REPO, SERVICE];
    const hash = [];

    for ( const type of types ) {
      if ( this.$store.getters['cluster/canList'](type) ) {
        hash.push(this.$fetchType(type));
      }
    }

    await allHash(hash);

    if ( this.jaegerQuerySvc ) {
      const options = {
        store:           this.$store,
        queryService:    this.jaegerQuerySvc,
        resource:        this.resource,
        relatedPolicies: null,
        policy:          null
      };

      if ( this.resource === KUBEWARDEN.POLICY_SERVER ) {
        options.relatedPolicies = this.relatedPolicies;
      } else {
        options.policy = this.policy;
      }

      this.specificValidations = await jaegerTraces(options);
    }
  },

  data() {
    return {
      MODE_MAP,
      TRACE_HEADERS,
      OPERATION_MAP,

      specificValidations: null
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ charts: 'catalog/charts' }),

    allApps() {
      return this.$store.getters['cluster/all'](CATALOG.APP);
    },

    allServices() {
      return this.$store.getters['cluster/all'](SERVICE);
    },

    controllerApp() {
      return this.allApps?.find(app => app?.spec?.chart?.metadata?.name === KUBEWARDEN_CHARTS.CONTROLLER);
    },

    controllerChart() {
      return this.charts?.find(chart => chart.chartName === KUBEWARDEN_CHARTS.CONTROLLER);
    },

    groupField() {
      if ( this.isPolicyServer ) {
        return 'policy_id';
      }

      return null;
    },

    isPolicyServer() {
      return this.resource === KUBEWARDEN.POLICY_SERVER;
    },

    emptyPolicies() {
      if ( this.resource === KUBEWARDEN.POLICY_SERVER ) {
        return isEmpty(this.relatedPolicies);
      }

      return isEmpty(this.policy);
    },

    emptyTraces() {
      return isEmpty(this.filteredValidations);
    },

    emptyTracesLabel() {
      if ( this.resource === KUBEWARDEN.POLICY_SERVER ) {
        return 'kubewarden.tracing.noRelatedTraces';
      }

      return 'kubewarden.tracing.noTraces';
    },

    rowsPerPage() {
      if ( this.isPolicyServer ) {
        return 40;
      }

      return 20;
    },

    tracingConfiguration() {
      if ( this.controllerChart ) {
        return this.controllerChart?.spec?.values?.telemetry?.tracing;
      }

      return null;
    },

    tracingEnabled() {
      if ( this.tracingConfiguration ) {
        return this.tracingConfiguration.enabled;
      }

      return null;
    },

    jaegerServices() {
      return this.allServices?.filter(svc => svc?.metadata?.labels?.['app.kubernetes.io/part-of'] === 'jaeger');
    },

    jaegerQuerySvc() {
      if ( !isEmpty(this.jaegerServices) ) {
        return this.jaegerServices.find((svc) => {
          const ports = svc?.spec?.ports;

          if ( ports.length ) {
            return ports.find(p => p.port === 16685 || p.port === 16686);
          }
        });
      }

      return null;
    },

    openTelemetryServices() {
      return this.allServices?.filter(svc => svc?.metadata?.labels?.[KUBERNETES.MANAGED_NAME] === 'opentelemetry-operator');
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

    showChecklist() {
      return (!this.openTelSvc || !this.jaegerQuerySvc || !this.tracingConfiguration?.enabled);
    },

    showTable() {
      return (!this.emptyPolicies && !this.showChecklist && !this.emptyTraces);
    },

    filteredValidations() {
      if ( !isEmpty(this.specificValidations) ) {
        return this.specificValidations.flatMap((v) => {
          if ( this.currentCluster?.id === v.cluster ) {
            return v.traces;
          } else {
            return [];
          }
        });
      }

      return [];
    }
  },

  methods: {
    modeColor(mode) {
      return this.MODE_MAP[mode];
    },

    opColor(op) {
      return this.OPERATION_MAP[op];
    },

    formatTime(time) {
      return dayjs(time / 1000);
    },

    duration(duration) {
      return formatDuration(duration);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <TraceChecklist
      v-if="showChecklist"
      :controller-app="controllerApp"
      :tracing-configuration="tracingConfiguration"
      :jaeger-query-svc="jaegerQuerySvc"
      :open-tel-svc="openTelSvc"
    />

    <Banner
      v-else-if="!showChecklist && emptyPolicies"
      color="error"
      :label="t('kubewarden.tracing.noRelatedPolicies')"
    />

    <SortableTable
      v-else-if="showTable"
      :rows="filteredValidations"
      :headers="TRACE_HEADERS"
      :table-actions="false"
      :row-actions="false"
      key-field="id"
      default-sort-by="startTime"
      :sub-expandable="true"
      :sub-expand-column="true"
      :sub-rows="true"
      :paging="true"
      :rows-per-page="rowsPerPage"
    >
      <template #col:mode="{row}">
        <td>
          <BadgeState
            :label="row.mode"
            :color="modeColor(row.mode)"
            class="text-capitalize"
          />
        </td>
      </template>

      <template #col:name="{row}">
        <td class="text-bold">
          {{ row.name }}
        </td>
      </template>

      <template #col:namespace="{row}">
        <td>
          {{ row.namespace ? row.namespace : '-' }}
        </td>
      </template>

      <template #col:startTime="{row}">
        <td>
          {{ formatTime(row.startTime) }}
        </td>
      </template>

      <template #col:duration="{row}">
        <td>
          {{ duration(row.duration) }}
        </td>
      </template>

      <template #sub-row="{row, fullColspan}">
        <td :colspan="fullColspan" class="sub-row">
          <div class="details">
            <section class="col">
              <div class="title">
                Response Message
              </div>
              <span class="text-info text-capitalize">
                {{ row.responseMessage ? row.responseMessage : '-' }}
              </span>
            </section>
            <section class="col">
              <div class="title">
                Response Code
              </div>
              <span class="text-info">
                {{ row.responseCode ? row.responseCode : '-' }}
              </span>
            </section>
            <section class="col">
              <div class="title">
                Mutated
              </div>
              <span class="text-info">
                {{ row.mutated }}
              </span>
            </section>
          </div>
        </td>
      </template>
    </SortableTable>

    <Banner
      v-else
      color="warning"
      :label="t(emptyTracesLabel)"
    />
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
