<template>
  <div class="search-filters">
    <div class="filter-row">
      <div class="filter-item">
        <label>{{ t('imageScanner.registries.registrytable.header.registry') }}</label>
        <div class="filter-input-wrapper">
          <input
            v-model="filters.registrySearch"
            type="text"
            :placeholder="t('imageScanner.registries.registrytable.filters.placeholder.name')"
            class="filter-input"
          />
          <i
            class="icon icon-search"
            style="color: #6C6C76; margin-left: 8px;"
          ></i>
        </div>
      </div>
      <div class="filter-item">
        <label>{{ t('imageScanner.registries.registrytable.header.namespace') }}</label>
        <div class="filter-input-wrapper">
          <input
            v-model="filters.namespaceSearch"
            type="text"
            :placeholder="t('imageScanner.registries.registrytable.filters.placeholder.name')"
            class="filter-input"
          />
          <i
            class="icon icon-search"
            style="color: #6C6C76; margin-left: 8px;"
          ></i>
        </div>
      </div>
      <div class="filter-item">
        <label>{{ t('imageScanner.registries.registrytable.header.uri') }}</label>
        <div class="filter-input-wrapper">
          <input
            v-model="filters.uriSearch"
            type="text"
            :placeholder="t('imageScanner.registries.registrytable.filters.placeholder.address')"
            class="filter-input"
          />
          <i
            class="icon icon-search"
            style="color: #6C6C76; margin-left: 8px;"
          ></i>
        </div>
      </div>
      <div class="filter-item">
        <label>{{ t('imageScanner.registries.registrytable.header.repos') }}</label>
        <div class="filter-input-wrapper">
          <input
            v-model="filters.repositorySearch"
            type="text"
            :placeholder="t('imageScanner.registries.registrytable.filters.placeholder.name')"
            class="filter-input"
          />
          <i
            class="icon icon-search"
            style="color: #6C6C76; margin-left: 8px;"
          ></i>
        </div>
      </div>
      <div class="filter-item">
        <label>{{ t('imageScanner.registries.registrytable.header.status') }}</label>
        <LabeledSelect
          v-model:value="filters.statusSearch"
          :options="filterStatusOptions"
          :close-on-select="true"
          :multiple="false"
        />
      </div>
    </div>
  </div>
  <PaginatedResourceTable
    ref="registryTable"
    :headers="headers"
    :schema="schema"
    :namespaced="false"
    :table-actions="true"
    :row-actions="true"
    :search="false"
    :key-field="'id'"
    :fetch-secondary-resources="fetchSecondaryResources"
    :fetch-page-secondary-resources="fetchPageSecondaryResources"
    :local-filter="filterRowsLocal"
    :api-filter="filterRowsApi"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    @selection="onSelectionChange"
  >
    <template #header-left>
      <div class="table-top-left">
        <ScanButton
          v-if="canEdit"
          class="table-btn"
          :selected-registries="selectedRows?.map(row => {return {name: row.metadata.name, namespace: row.metadata.namespace, currStatus: row.currStatus}})"
        />
        <button
          v-if="canDelete"
          class="btn role-primary table-btn"
          :disabled="!(selectedRows && selectedRows.length)"
          @click="promptRemoveRegistry()"
        >
          <i
            class="icon icon-delete"
            style="margin-right: 8px;"
          ></i>
          {{ t('imageScanner.registries.button.delete') || 'Delete' }}
        </button>
        <div
          v-if="selectedRows.length > 0"
          class="selected-count"
        >
          {{ selectedRows.length }} {{ selectedRows.length > 1 ? t('imageScanner.registries.registrytable.selection.registries') : t('imageScanner.registries.registrytable.selection.registry') }}
        </div>
      </div>
    </template>
  </PaginatedResourceTable>
</template>

<script>

import { RESOURCE } from '@pkg/types';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { REGISTRY_SCAN_TABLE } from '@pkg/config/table-headers';
import ScanButton from '@pkg/components/common/ScanButton';
import { findBy } from '@shell/utils/array';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import _ from 'lodash';
import { getPermissions } from '@pkg/utils/permissions';

export default {
  name:       'Registries',
  components: {
    PaginatedResourceTable,
    LabeledSelect,
    ScanButton,
  },
  props: {
    statusFilterLink: {
      type:    String,
      default: 'any'
    }
  },
  data() {
    const STATUS_OPTIONS = [
      { value: 'any', label: this.t('imageScanner.general.any') },
      { value: 'scheduled', label: this.t('imageScanner.enum.status.scheduled') },
      { value: 'pending', label: this.t('imageScanner.enum.status.pending') },
      { value: 'inprogress', label: this.t('imageScanner.enum.status.inprogress') },
      { value: 'complete', label: this.t('imageScanner.enum.status.complete') },
      { value: 'failed', label: this.t('imageScanner.enum.status.failed') },
    ];

    return {
      headers:            REGISTRY_SCAN_TABLE,
      selectedRows:       [],
      filters:            {
        registrySearch:   '',
        namespaceSearch:  '',
        uriSearch:        '',
        repositorySearch: '',
        statusSearch:     STATUS_OPTIONS[0],
      },
      debouncedFilters: {
        registrySearch:   '',
        namespaceSearch:  '',
        uriSearch:        '',
        repositorySearch: '',
        statusSearch:     STATUS_OPTIONS[0],
      },
      filterStatusOptions:              STATUS_OPTIONS,
      keepAliveTimer:                   null,
      useQueryParamsForSimpleFiltering: false,
      canEdit:                          getPermissions(this.$store.getters).canEdit,
      canDelete:                        getPermissions(this.$store.getters).canDelete,
    };
  },
  watch: {
    filters: {
      handler: _.debounce(function(newFilters) {
        this.debouncedFilters = { ...newFilters };
      }, 500),
      deep: true,
    },
    statusFilterLink(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.filters.statusSearch = newVal;
      }
    }
  },
  methods: {

    onSelectionChange(selected) {
      this.selectedRows = selected || [];
    },
    async promptRemoveRegistry() {
      const table = this.$refs.registryTable.$refs.table.$refs.table;

      const act = findBy(table.availableActions, 'action', 'promptRemove');

      if ( act ) {
        table.setBulkActionOfInterest(act);
        table.applyTableAction(act);
      }
    },
    filterRowsLocal(rows) {
      const filters = this.debouncedFilters;

      return rows.filter((row) => {
        const registryMatch = !filters.registrySearch ||
            row.metadata?.name?.toLowerCase().includes(filters.registrySearch.toLowerCase());

        const namespaceMatch = !filters.namespaceSearch ||
            row.metadata?.namespace?.toLowerCase().includes(filters.namespaceSearch.toLowerCase());

        const uriMatch = !filters.uriSearch ||
            row.spec?.uri?.toLowerCase().includes(filters.uriSearch.toLowerCase());

        const repoMatch = !filters.repositorySearch ||
            (row.spec?.repositories || [])
              .some((repo) => repo.toLowerCase().includes(filters.repositorySearch.toLowerCase()));

        const statusMatch = !filters.statusSearch ||
            (typeof filters.statusSearch === 'object' && filters.statusSearch.value.toLowerCase() === 'any') ||
            (typeof filters.statusSearch === 'string' && filters.statusSearch.toLowerCase() === 'any') ||
            (typeof row.scanRec?.currStatus === 'object' && row.scanRec?.currStatus.value.toLowerCase() === filters.statusSearch.value.toLowerCase()) ||
            (typeof row.scanRec?.currStatus === 'string' && row.scanRec?.currStatus.toLowerCase() === filters.statusSearch.toLowerCase());

        return registryMatch && namespaceMatch && uriMatch && repoMatch && statusMatch;
      });
    },
    filterRowsApi(pagination) {
      const filters = this.debouncedFilters;
      const colFields = [{
        field:  'metadata.name',
        value:  filters.registrySearch,
        equals: true,
        exact:  false,
      },
      {
        field:  'metadata.namespace',
        value:  filters.namespaceSearch,
        equals: true,
        exact:  false,
      },
      {
        field:  'spec.uri',
        value:  filters.uriSearch,
        equals: true,
        exact:  false,
      },
      {
        field:  'spec.repositories',
        value:  filters.repositorySearch,
        equals: true,
        exact:  false,
      },
      {
        field:  'scanRec.currStatus',
        value:  typeof filters.statusSearch === 'object' ? filters.statusSearch.value : filters.statusSearch,
        equals: true,
        exact:  false,
      }];

      const colFilter = PaginationParamFilter.createMultipleFields(colFields);

      pagination.filters.push(colFilter);

      return pagination;
    },
  },
  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor'](RESOURCE.REGISTRY);
    },
    canPaginate() {
      const args = { id: RESOURCE.REGISTRY };

      return this.$store.getters[`cluster/paginationEnabled`]?.(args);
    },
  },
};
</script>

<style lang="scss" scoped>
  .table-top-left {
      display: flex;
      align-items: center;
      justify-content: start;
      flex: 1 0 0;
      gap: 16px;
    .table-btn {
      height: 40px;
    }
  }

  .selected-count {
    font-weight: 400;
  }

  .filter-row {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
  }

  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .filter-item label {
    font-weight: 400;
    color: var(--disabled-text);
    font-size: 14px;
  }

  .filter-input-wrapper {
    display: flex;
    align-items: center;
    border: solid var(--border-width) var(--input-border);
    border-radius: 6px;
    padding: 0 12px;
    background: var(--input-bg);
  }

  .filter-input {
    flex: 1;
    padding: 10px 0;
    border: none;
    outline: none;
    font-size: 14px;
    line-height: 19px;
    background: transparent;
  }

  .filter-input:focus {
    outline: none;
  }

  .filter-input-wrapper:focus-within {
    border-color: #007cba;
    box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.1);
  }

  .filter-select {
    padding: 10px 14px;
    border: 1px solid #DCDEE7;
    border-radius: 6px;
    font-size: 14px;
    background: #FFF;
    outline: none;
  }

  .filter-select:focus {
    border-color: #007cba;
    box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.1);
  }

  .filter-actions {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid #DCDEE7;
  }

</style>
