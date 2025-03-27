<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import semver from 'semver';
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

import { TRACE_HEADERS } from '@kubewarden/config/table-headers';
import { KUBEWARDEN, KUBEWARDEN_CHARTS, MODE_MAP, OPERATION_MAP } from '@kubewarden/types';
import { jaegerTraces } from '@kubewarden/modules/jaegerTracing';
import { isAdminUser } from '@kubewarden/utils/permissions';
import { formatDuration } from '@kubewarden/utils/duration-format';

import TraceChecklist from './TraceChecklist';

dayjs.extend(relativeTime);

export default {
  props: {
    resource: {
      type:    String,
      default: () => ''
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
    BadgeState,
    Banner,
    Loading,
    SortableTable,
    TraceChecklist
  },

  mixins: [ResourceFetch],

  async fetch() {
    await this.fetchData();
  },

  data() {
    return {
      MODE_MAP,
      TRACE_HEADERS,
      OPERATION_MAP,

      isAdminUser: false,
      permissions: {
        policyServer: false,
        app:          false,
        clusterRepo:  false,
        service:      false
      },

      specificValidations:      null,
      outdatedTelemetrySpec:    false,
      unsupportedTelemetrySpec: false,
      incompleteTelemetrySpec:  false
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({
      charts:           'catalog/charts',
      refreshingCharts: 'kubewarden/refreshingCharts'
    }),

    allApps() {
      return this.$store.getters['cluster/all'](CATALOG.APP);
    },

    allServices() {
      return this.$store.getters['cluster/all'](SERVICE);
    },

    controllerApp() {
      return this.allApps?.find(
        (app) => app?.spec?.chart?.metadata?.name === KUBEWARDEN_CHARTS.CONTROLLER
      );
    },

    controllerChart() {
      return this.charts?.find(
        (chart) => chart?.chartName === KUBEWARDEN_CHARTS.CONTROLLER
      );
    },

    groupField() {
      return this.isPolicyServer ? 'policy_id' : null;
    },

    isPolicyServer() {
      return this.resource === KUBEWARDEN.POLICY_SERVER;
    },

    emptyPolicies() {
      return this.resource === KUBEWARDEN.POLICY_SERVER ? isEmpty(this.relatedPolicies) : isEmpty(this.policy);
    },

    emptyTraces() {
      return isEmpty(this.filteredValidations);
    },

    emptyTracesLabel() {
      return this.resource === KUBEWARDEN.POLICY_SERVER ? 'kubewarden.tracing.noRelatedTraces' : 'kubewarden.tracing.noTraces';
    },

    hasAvailability() {
      return this.isAdminUser || Object.values(this.permissions).every((value) => value);
    },

    rowsPerPage() {
      return this.isPolicyServer ? 40 : 20;
    },

    tracingConfiguration() {
      if (!this.controllerApp?.values) {
        return null;
      }

      const version = this.controllerApp?.spec?.chart?.metadata?.version;
      const telemetry = this.controllerApp?.values?.telemetry;

      if (semver.gte(version, '4.0.0-0')) {
        const tracingIsUndefinedOrBoolean =
          telemetry?.tracing === undefined || typeof telemetry?.tracing === 'boolean';
        const endpointIsDefined = !!telemetry?.sidecar?.tracing?.jaeger?.endpoint;

        if (telemetry?.mode === 'custom') {
          this.handleTracingChecklist('unsupportedTelemetrySpec', true);

          return null;
        }
        if (!tracingIsUndefinedOrBoolean) {
          this.handleTracingChecklist('outdatedTelemetrySpec', true);

          return null;
        }
        if (telemetry?.tracing === true && !endpointIsDefined) {
          this.handleTracingChecklist('incompleteTelemetrySpec', true);

          return null;
        }
        if (telemetry?.tracing !== true) {
          return null;
        }

        return telemetry?.sidecar?.tracing;
      } else {
        return telemetry?.tracing?.enabled;
      }
    },

    jaegerServices() {
      return this.allServices?.filter(
        (svc) => svc?.metadata?.labels?.['app.kubernetes.io/part-of'] === 'jaeger'
      );
    },

    jaegerQuerySvc() {
      if (!isEmpty(this.jaegerServices)) {
        return this.jaegerServices.find((svc) => {
          const ports = svc?.spec?.ports;

          if (ports.length) {
            return ports.find((p) => p.port === 16685 || p.port === 16686);
          }
        });
      }

      return null;
    },

    openTelemetryServices() {
      return this.allServices?.filter(
        (svc) => svc?.metadata?.labels?.[KUBERNETES.MANAGED_NAME] === 'opentelemetry-operator'
      );
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

    showChecklist() {
      return (!this.openTelSvc || !this.jaegerQuerySvc || !this.tracingConfiguration);
    },

    showTable() {
      return (!this.emptyPolicies && !this.showChecklist && !this.emptyTraces);
    },

    filteredValidations() {
      if (!isEmpty(this.specificValidations)) {
        return this.specificValidations.flatMap((v) => {
          return this.currentCluster?.id === v.cluster ? v.traces : [];
        });
      }

      return [];
    }
  },

  methods: {
    async fetchData() {
      this.setAdminUser();
      this.setPermissions();
      await this.fetchCanListResources();
      await this.handleJaegerTracing();
      await this.fetchControllerAppValues();
    },

    setAdminUser() {
      this.isAdminUser = isAdminUser(this.$store.getters);
    },

    setPermissions() {
      const types = {
        policyServer: { type: KUBEWARDEN.POLICY_SERVER },
        app:          { type: CATALOG.APP },
        clusterRepo:  { type: CATALOG.CLUSTER_REPO },
        service:      { type: SERVICE }
      };

      Object.entries(types).forEach(([key, value]) => {
        if (this.$store.getters['cluster/canList'](value)) {
          this.permissions[key] = true;
        }
      });
    },

    async fetchCanListResources() {
      const canListTypes = [CATALOG.APP, CATALOG.CLUSTER_REPO, SERVICE];
      const promises = [];

      canListTypes.forEach((type) => {
        if (this.$store.getters['cluster/canList'](type)) {
          promises.push(this.$fetchType(type));
        }
      });

      await allHash(promises);
    },

    async handleJaegerTracing() {
      if (this.jaegerQuerySvc) {
        const options = {
          store:           this.$store,
          queryService:    this.jaegerQuerySvc,
          resource:        this.resource,
          relatedPolicies: null,
          policy:          null
        };

        if (this.resource === KUBEWARDEN.POLICY_SERVER) {
          options.relatedPolicies = this.relatedPolicies;
        } else {
          options.policy = this.policy;
        }

        this.specificValidations = await jaegerTraces(options);
      }
    },

    async fetchControllerAppValues() {
      if (this.controllerApp) {
        await this.controllerApp.fetchValues(true);
      }
    },

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
    },

    handleTracingChecklist(prop, val) {
      this[prop] = val;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending || refreshingCharts" mode="relative" />
  <div v-else>
    <Banner
      v-if="!hasAvailability"
      color="error"
      class="mt-20 mb-20"
      data-testid="kw-unavailability-banner"
      :label="t('kubewarden.unavailability.banner', { type: t('kubewarden.unavailability.type.tracingDashboard') })"
    />

    <TraceChecklist
      v-else-if="showChecklist"
      :controller-app="controllerApp"
      :controller-chart="controllerChart"
      :tracing-configuration="tracingConfiguration"
      :jaeger-query-svc="jaegerQuerySvc"
      :open-tel-svc="openTelSvc"
      :outdated-telemetry-spec="outdatedTelemetrySpec"
      :unsupported-telemetry-spec="unsupportedTelemetrySpec"
      :incomplete-telemetry-spec="incompleteTelemetrySpec"
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
              <div class="title">Response Message</div>
              <span class="text-info text-capitalize">
                {{ row.responseMessage ? row.responseMessage : '-' }}
              </span>
            </section>
            <section class="col">
              <div class="title">Response Code</div>
              <span class="text-info">
                {{ row.responseCode ? row.responseCode : '-' }}
              </span>
            </section>
            <section class="col">
              <div class="title">Mutated</div>
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
