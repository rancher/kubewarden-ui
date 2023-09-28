<script>
import isEmpty from 'lodash/isEmpty';
import { NAMESPACE } from '@shell/config/query-params';
import { allHash } from '@shell/utils/promise';
import ResourceFetch from '@shell/mixins/resource-fetch';

import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import SortableTable from '@shell/components/SortableTable';

import { KUBEWARDEN } from '../../types';
import { POLICY_REPORTER_HEADERS } from '../../config/table-headers';
import { getFilteredReports, getLinkForPolicy, colorForResult, colorForSeverity } from '../../modules/policyReporter';

export default {
  props: {
    resource: {
      type:     Object,
      required: true
    }
  },

  components: {
    BadgeState, Banner, Loading, SortableTable
  },

  mixins: [ResourceFetch],

  async fetch() {
    const fetchedReports = await getFilteredReports(this.$store, this.resource);

    if ( this.isNamespaceResource ) {
      this.reports = fetchedReports.results || [];
    } else {
      this.reports = fetchedReports || [];
    }

    if ( !isEmpty(this.reports) ) {
      const hash = [
        this.$fetchType(KUBEWARDEN.ADMISSION_POLICY),
        this.$fetchType(KUBEWARDEN.CLUSTER_ADMISSION_POLICY)
      ];

      await allHash(hash);
    }
  },

  data() {
    return {
      colorForResult,
      headers:      POLICY_REPORTER_HEADERS,
      reports:      null
    };
  },

  created() {
    if ( !this.isNamespaceResource ) {
      this.headers = this.headers.slice(2);
    }
  },

  computed: {
    canGetKubewardenLinks() {
      const capSchema = this.$store.getters['cluster/schemaFor'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY);
      const apSchema = this.$store.getters['cluster/schemaFor'](KUBEWARDEN.ADMISSION_POLICY);

      if ( capSchema || apSchema ) {
        return true;
      }

      return false;
    },

    hasNamespace() {
      return this.resource?.metadata?.namespace;
    },

    isNamespaceResource() {
      return this.resource?.type === NAMESPACE;
    }
  },

  methods: {
    getResourceValue(row, val, needsResource = false) {
      if ( this.isNamespaceResource && needsResource && !isEmpty(row.resources) ) {
        return row.resources[0][val] || '-';
      }

      if ( !isEmpty(row) ) {
        return row[val] || '-';
      }

      return '-';
    },

    getPolicyLink(row) {
      return getLinkForPolicy(this.$store, row);
    },

    severityColor(row) {
      if ( row.result ) {
        return colorForSeverity(row.severity);
      }

      return 'bg-muted';
    },

    statusColor(row) {
      if ( row.result ) {
        const color = colorForResult(row.result);
        const bgColor = color.includes('sizzle') ? color.concat('-bg') : color.replace(/text-/, 'bg-');

        return bgColor;
      }

      return 'bg-muted';
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else class="pr-tab__container">
    <SortableTable
      v-if="reports"
      :rows="reports"
      :headers="headers"
      :table-actions="false"
      :row-actions="false"
      key-field="uid"
      :sub-expandable="true"
      :sub-expand-column="true"
      :sub-rows="true"
      :paging="true"
      :rows-per-page="40"
    >
      <!-- Namespace Resource columns -->
      <template v-if="isNamespaceResource" #col:kind="{row}">
        <td>{{ getResourceValue(row, 'kind', true) }}</td>
      </template>
      <template v-if="isNamespaceResource" #col:name="{row}">
        <td>
          <span>{{ getResourceValue(row, 'name', true) }}</span>
        </td>
      </template>

      <template #col:policy="{row}">
        <td v-if="row.policy" :class="{ 'text-bold': isNamespaceResource}">
          <template v-if="canGetKubewardenLinks">
            <n-link :to="getPolicyLink(row)">
              <span>{{ row.policy }}</span>
            </n-link>
          </template>
          <template v-else>
            <span>{{ row.policy }}</span>
          </template>
        </td>
      </template>
      <template #col:rule="{row}">
        <td class="text-bold">
          {{ row.rule }}
        </td>
      </template>
      <template #col:severity="{row}">
        <td>
          <BadgeState
            :label="getResourceValue(row, 'severity')"
            :color="severityColor(row)"
          />
        </td>
      </template>
      <template #col:status="{row}">
        <td>
          <BadgeState
            :label="getResourceValue(row, 'result')"
            :color="statusColor(row)"
          />
        </td>
      </template>

      <!-- Sub-rows -->
      <template #sub-row="{row, fullColspan}">
        <td :colspan="fullColspan" class="pr-tab__sub-row">
          <Banner v-if="row.message" color="info" class="message">
            <span class="text-muted">{{ t('kubewarden.policyReporter.headers.policyReportsTab.message.title') }}:</span>
            <span>{{ row.message }}</span>
          </Banner>
          <div class="details">
            <section class="col">
              <div class="title">
                {{ t('kubewarden.policyReporter.headers.policyReportsTab.properties.mutating') }}
              </div>
              <span>
                {{ row.properties['mutating'] || '-' }}
              </span>
            </section>
            <section class="col">
              <div class="title">
                {{ t('kubewarden.policyReporter.headers.policyReportsTab.properties.validating') }}
              </div>
              <span>
                {{ row.properties['validating'] || '-' }}
              </span>
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