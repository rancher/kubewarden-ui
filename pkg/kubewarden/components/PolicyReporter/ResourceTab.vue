<script setup lang="ts">
import {
  ref, reactive, computed, onMounted, watch, nextTick, getCurrentInstance
} from 'vue';
import { useStore } from 'vuex';
import { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router';
import isEmpty from 'lodash/isEmpty';

import { NAMESPACE } from '@shell/config/query-params';

import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import SortableTable from '@shell/components/SortableTable';

import { KUBEWARDEN, PolicyReport, PolicyReportResult, ClusterPolicyReport } from '../../types';
import { POLICY_REPORTER_HEADERS } from '../../config/table-headers';
import {
  getFilteredReport,
  getLinkForPolicy,
  colorForResult,
  colorForSeverity
} from '../../modules/policyReporter';

const store = useStore();
let route: RouteLocationNormalizedLoaded | null = null;

const t = store.getters['i18n/t'];

const report = ref<PolicyReport | ClusterPolicyReport | null>(null);
const resource = ref<any>(null);
const canGetKubewardenLinks = ref(false);
const headers = ref(POLICY_REPORTER_HEADERS);

const fetchState = reactive({ pending: true });

const isNamespaceResource = computed(() => resource.value?.type === NAMESPACE);

function determineResource() {
  if (route?.params?.resource && route?.params?.id) {
    const id = route?.params.namespace ? `${ route?.params.namespace }/${ route?.params.id }` : route?.params.id;

    resource.value = store.getters['cluster/byId'](route?.params.resource, id);
  }
}

async function fetchReports() {
  if (resource.value) {
    fetchState.pending = true;
    report.value  = await getFilteredReport(store, resource.value);
  }

  fetchState.pending = false;
}

function getResourceValue(row: PolicyReportResult, val: string, needScope = false): string {
  if (isNamespaceResource.value && needScope) {
    if (row.scope && val in row.scope) {
      const value = row.scope[val as keyof typeof row.scope];

      return typeof value === 'string' ? value : '-';
    }

    return '-';
  }

  if (!isEmpty(row)) {
    if (val in row) {
      const value = row[val as keyof (PolicyReportResult)];

      return typeof value === 'string' ? value : '-';
    }
  }

  return '-';
}

function getPolicyLink(row: PolicyReportResult): RouteLocationRaw | undefined {
  const link = getLinkForPolicy(store, row);

  if (link) {
    return link;
  }
}

function severityColor(row: PolicyReportResult) {
  if (row.result && row.severity) {
    return colorForSeverity(row.severity);
  }

  return 'bg-muted';
}

function statusColor(row: PolicyReportResult) {
  if (row.result) {
    const color = colorForResult(row.result);
    const bgColor = color.includes('sizzle') ? `${ color }-bg` : color.replace(/text-/, 'bg-');

    return bgColor;
  }

  return 'bg-muted';
}

onMounted(async() => {
  // Ensure Vue Router is initialized before accessing `useRoute()`
  if (!route) {
    const instance = getCurrentInstance();

    if (instance?.proxy?.$route) {
      route = instance.proxy.$route;
    } else {
      return;
    }
  }

  determineResource();

  await nextTick();
  await fetchReports();

  const capSchema = store.getters['cluster/schemaFor'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY);
  const apSchema = store.getters['cluster/schemaFor'](KUBEWARDEN.ADMISSION_POLICY);

  canGetKubewardenLinks.value = !!(capSchema || apSchema);
});
</script>

<template>
  <div v-if="fetchState.pending" data-testid="resource-tab-loading" class="pr-tab__loading">
    <i class="icon icon-lg icon-spinner icon-spin  m-20" />
  </div>
  <div v-else class="pr-tab__container">
    <SortableTable
      :rows="report?.results"
      :headers="headers"
      :table-actions="false"
      :row-actions="false"
      key-field="policy"
      :sub-expandable="true"
      :sub-expand-column="true"
      :sub-rows="true"
      :paging="true"
      :rows-per-page="25"
      :extra-search-fields="['summary']"
      default-sort-by="status"
    >
      <template #col:policy="{ row }">
        <td v-if="row.policy">
          <template v-if="canGetKubewardenLinks">
            <router-link :to="getPolicyLink(row)!">
              <span>{{ row.policy }}</span>
            </router-link>
          </template>
          <template v-else>
            <span>{{ row.policy }}</span>
          </template>
        </td>
      </template>
      <template #col:severity="{ row }">
        <td>
          <BadgeState
            :label="getResourceValue(row, 'severity')"
            :color="severityColor(row)"
          />
        </td>
      </template>
      <template #col:status="{ row }">
        <td>
          <BadgeState
            :label="getResourceValue(row, 'result')"
            :color="statusColor(row)"
          />
        </td>
      </template>

      <!-- Sub-rows -->
      <template #sub-row="{ row, fullColspan }">
        <td :colspan="fullColspan" class="pr-tab__sub-row">
          <Banner v-if="row.message" color="info" class="message">
            <span class="text-muted">
              {{ t('kubewarden.policyReporter.headers.policyReportsTab.message.title') }}:
            </span>
            <span>{{ row.message }}</span>
          </Banner>
          <div class="details">
            <section class="col">
              <div class="title">
                {{ t('kubewarden.policyReporter.headers.policyReportsTab.category') }}
              </div>
              <span>{{ row.category || '-' }}</span>
            </section>
            <section class="col">
              <div class="title">
                {{ t('kubewarden.policyReporter.headers.policyReportsTab.properties.mutating') }}
              </div>
              <span>{{ row.properties['mutating'] || '-' }}</span>
            </section>
            <section class="col">
              <div class="title">
                {{ t('kubewarden.policyReporter.headers.policyReportsTab.properties.validating') }}
              </div>
              <span>{{ row.properties['validating'] || '-' }}</span>
            </section>
          </div>
        </td>
      </template>
    </SortableTable>
  </div>
</template>

<style lang="scss" scoped>
$error: #614EA2;

// Need to override the default colors for these classes
.pr-tab {
  &__loading {
    display: flex;
    justify-content: center;
  }

  &__container {
    .sizzle-warning-bg {
      background-color: $error;
      color: #fff;
    }

    .text-warning {
      color: var(--warning) !important;
    }

    .text-darker {
      color: var(--dark) !important;
    }

    .sizzle-warning {
      color: $error;
    }
  }

  &__sub-row {
    background-color: var(--body-bg);
    border-bottom: 1px solid var(--sortable-table-top-divider);
    padding-left: 1rem;
    padding-right: 1rem;

    .message {
      display: flex;
      flex-direction: column;
    }

    .details {
      display: flex;
      flex-direction: row;

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
  }
}

</style>