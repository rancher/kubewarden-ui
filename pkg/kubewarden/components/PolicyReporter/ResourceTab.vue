<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, RouteLocationRaw } from 'vue-router';
import isEmpty from 'lodash/isEmpty';

import { NAMESPACE } from '@shell/config/query-params';
import { allHash } from '@shell/utils/promise';

import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import SortableTable from '@shell/components/SortableTable';

import { KUBEWARDEN, PolicyReport, PolicyReportResult } from '../../types';
import { POLICY_REPORTER_HEADERS } from '../../config/table-headers';
import {
  getFilteredReports,
  getLinkForPolicy,
  getLinkForResource,
  colorForResult,
  colorForSeverity
} from '../../modules/policyReporter';
import { splitGroupKind } from '../../modules/core';
import * as coreTypes from '../../core/core-resources';

const store = useStore();
const route = useRoute();
const t = store.getters['i18n/t'];

const reports = ref<(PolicyReport | PolicyReportResult)[]>([]);
const resource = ref<any>(null);
const canGetKubewardenLinks = ref(false);

const resourceHeaders = POLICY_REPORTER_HEADERS.RESOURCE;
const namespaceHeaders = POLICY_REPORTER_HEADERS.NAMESPACE;

const fetchState = reactive({
  pending: true
});

function determineResource() {
  if (route?.params?.resource && route?.params?.id) {
    const id = route.params.namespace ? `${ route.params.namespace }/${ route.params.id }` : route.params.id;
    resource.value = store.getters['cluster/byId'](route.params.resource, id);
  }
}

async function fetchReports() {
  if (resource.value) {
    const fetchedReports  = await getFilteredReports(store, resource.value) ?? [];
    
    if (!isEmpty(fetchedReports)) {
      const hash = [
        store.dispatch('cluster/findAll', { type: KUBEWARDEN.ADMISSION_POLICY }),
        store.dispatch('cluster/findAll', { type: KUBEWARDEN.CLUSTER_ADMISSION_POLICY }),
      ];

      await allHash(hash);
    }
    
    // Assign the value *after* all async calls to avoid triggering unnecessary reactivity
    reports.value = [...fetchedReports];
  }
  
  fetchState.pending = false;
}


onMounted(() => {
  determineResource();
  fetchReports();

  const capSchema = store.getters['cluster/schemaFor'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY);
  const apSchema = store.getters['cluster/schemaFor'](KUBEWARDEN.ADMISSION_POLICY);
  
  canGetKubewardenLinks.value = !!(capSchema || apSchema);
});

const isNamespaceResource = computed(() => resource.value?.type === NAMESPACE);
const tableHeaders = computed(() =>
  isNamespaceResource.value ? namespaceHeaders : resourceHeaders
);

function canGetResourceLink(row: PolicyReport | PolicyReportResult): boolean {
  const outResource = row.scope;

  if (resource.value?.type === NAMESPACE && outResource?.kind?.toLowerCase() === NAMESPACE) {
    return false;
  }

  if (outResource) {
    const isCore = Object.values(coreTypes).find(
      (type: any) => outResource.kind === type.attributes.kind
    );

    if (isCore) {
      return store.getters['cluster/schemaFor'](outResource.kind?.toLowerCase());
    }

    const groupType = splitGroupKind(outResource);

    if (groupType) {
      return store.getters['cluster/schemaFor'](groupType);
    }
  }

  return false;
}

function getResourceValue(row: PolicyReport | PolicyReportResult, val: string, needScope = false): string {
  if (isNamespaceResource.value && needScope) {
    if (row.scope && val in row.scope) {
      const value = row.scope[val as keyof typeof row.scope];

      return typeof value === 'string' ? value : '-';
    }

    return '-';
  }

  if (!isEmpty(row)) {
    if (val in row) {
      const value = row[val as keyof (PolicyReport | PolicyReportResult)];

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

function getResourceLink(row: PolicyReport): RouteLocationRaw | undefined {
  const link = getLinkForResource(row);

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
    const bgColor = color.includes('sizzle')
      ? `${color}-bg`
      : color.replace(/text-/, 'bg-');
    return bgColor;
  }
  return 'bg-muted';
}
</script>

<template>
  <Loading v-if="fetchState.pending" mode="relative" />
  <div v-else class="pr-tab__container">
    <SortableTable
      :rows="reports"
      :headers="tableHeaders"
      :table-actions="false"
      :row-actions="false"
      key-field="uid"
      :group-by="isNamespaceResource ? 'kind' : null"
      :sub-expandable="true"
      :sub-expand-column="true"
      :sub-rows="true"
      :paging="true"
      :rows-per-page="25"
      :extra-search-fields="['summary']"
      default-sort-by="status"
    >
      <!-- When the resource is a Namespace, show the kind and name using the row’s scope -->
      <template v-if="isNamespaceResource" #col:kind="{ row }">
        <td>{{ getResourceValue(row, 'kind', true) }}</td>
      </template>
      <template v-if="isNamespaceResource" #col:name="{ row }">
        <td>
          <template v-if="canGetResourceLink(row)">
            <router-link :to="getResourceLink(row)!">
              <span>{{ getResourceValue(row, 'name', true) }}</span>
            </router-link>
          </template>
          <template v-else>
            <span>{{ getResourceValue(row, 'name', true) }}</span>
          </template>
        </td>
      </template>

      <template #col:policy="{ row }">
        <td v-if="row.policy && row.policyName">
          <template v-if="canGetKubewardenLinks">
            <router-link :to="getPolicyLink(row)!">
              <span>{{ row.policyName }}</span>
            </router-link>
          </template>
          <template v-else>
            <span>{{ row.policyName }}</span>
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