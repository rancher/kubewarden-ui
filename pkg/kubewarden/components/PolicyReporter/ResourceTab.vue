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
import {
  getFilteredReports, getLinkForPolicy, getLinkForResource, colorForResult, colorForSeverity
} from '../../modules/policyReporter';
import { splitGroupKind } from '../../modules/core';
import * as coreTypes from '../../core/core-resources';

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

    this.reports = fetchedReports || [];

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
      reports:          [],
      resourceHeaders:  POLICY_REPORTER_HEADERS.RESOURCE,
      namespaceHeaders: POLICY_REPORTER_HEADERS.NAMESPACE
    };
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

    hasReports() {
      return !isEmpty(this.reports);
    },

    isNamespaceResource() {
      return this.resource?.type === NAMESPACE;
    },

    tableHeaders() {
      return this.isNamespaceResource ? this.namespaceHeaders : this.resourceHeaders;
    }
  },

  methods: {
    canGetResourceLink(row) {
      const resource = row.scope;

      if ( resource ) {
        const isCore = Object.values(coreTypes).find(type => resource.kind === type.attributes.kind);

        if ( isCore ) {
          return this.$store.getters['cluster/schemaFor'](resource.kind?.toLowerCase());
        }

        const groupType = splitGroupKind(resource);

        if ( groupType ) {
          return this.$store.getters['cluster/schemaFor'](groupType);
        }
      }

      return null;
    },

    getResourceValue(row, val, needScope = false) {
      if ( this.isNamespaceResource && needScope ) {
        return row.scope?.[val] || '-';
      }

      if ( !isEmpty(row) ) {
        return row[val] || '-';
      }

      return '-';
    },

    getPolicyLink(row) {
      return getLinkForPolicy(this.$store, row);
    },

    getResourceLink(row) {
      return getLinkForResource(row);
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
    <template>
      <SortableTable
        :rows="reports"
        :headers="tableHeaders"
        :table-actions="false"
        :row-actions="false"
        key-field="uid"
        :sub-expandable="true"
        :sub-expand-column="true"
        :sub-rows="true"
        :paging="true"
        :rows-per-page="25"
        :extra-search-fields="['summary']"
        default-sort-by="status"
      >
        <template
          v-if="isNamespaceResource"
          #col:kind="{row}"
        >
          <td>{{ getResourceValue(row, 'kind', true) }}</td>
        </template>
        <template
          v-if="isNamespaceResource"
          #col:name="{row}"
        >
          <td>
            <template v-if="canGetResourceLink(row)">
              <n-link :to="getResourceLink(row)">
                <span>{{ getResourceValue(row, 'name', true) }}</span>
              </n-link>
            </template>
            <template v-else>
              <span>{{ getResourceValue(row, 'name', true) }}</span>
            </template>
          </td>
        </template>

        <template #col:policy="{row}">
          <td v-if="row.policy && row.rule">
            <template v-if="canGetKubewardenLinks">
              <n-link :to="getPolicyLink(row)">
                <span>{{ row.rule }}</span>
              </n-link>
            </template>
            <template v-else>
              <span>{{ row.rule }}</span>
            </template>
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
          <td
            :colspan="fullColspan"
            class="pr-tab__sub-row"
          >
            <Banner v-if="row.message" color="info" class="message">
              <span class="text-muted">{{ t('kubewarden.policyReporter.headers.policyReportsTab.message.title') }}:</span>
              <span>{{ row.message }}</span>
            </Banner>
          </td>
        </template>
      </SortableTable>
    </template>
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