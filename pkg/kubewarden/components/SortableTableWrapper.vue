<script setup lang="ts">
import {
  ref, watch, onMounted, onBeforeUnmount, nextTick
} from 'vue';

import SortableTable from '@shell/components/SortableTable';

interface Listener {
  row: HTMLElement;
  listener: (event: Event) => void; // eslint-disable-line no-unused-vars
}

interface Props {
  rows: Array<any>;
  headers: Array<any>;
  tableActions?: boolean;
  rowActions?: boolean;
  keyField: string;
  defaultSortBy?: string;
  paging?: boolean;
  search?: boolean;
  useQueryParamsForSimpleFiltering?: boolean;
}

defineProps<Props>();

const emit = defineEmits(['selectRow']);

const sortableTable = ref();
const listeners = ref<Listener[]>([]);

const addRowClickListener = () => {
  nextTick(() => {
    const table = sortableTable.value?.$el?.querySelector('table') as HTMLElement;

    if (table) {
      removeRowClickListener();

      table.querySelectorAll('tbody tr').forEach((row, index) => {
        const listener = () => {
          const rowsProp = (sortableTable.value?.$props as Props).rows || [];
          const indexFrom = sortableTable.value?.indexFrom || 1;

          emit('selectRow', rowsProp[indexFrom - 1 + index]);
        };

        row.addEventListener('click', listener);
        listeners.value.push({
          row: row as HTMLElement,
          listener
        });
      });
    }
  });
};

const removeRowClickListener = () => {
  listeners.value.forEach(({ row, listener }) => {
    row.removeEventListener('click', listener);
  });
  listeners.value = [];
};

watch(() => sortableTable.value?.$props.rows, () => {
  addRowClickListener();
});

onMounted(() => {
  addRowClickListener();
});

onBeforeUnmount(() => {
  removeRowClickListener();
});
</script>

<template>
  <div>
    <SortableTable
      ref="sortableTable"
      :rows="rows"
      :headers="headers"
      :table-actions="tableActions"
      :row-actions="rowActions"
      :key-field="keyField"
      :default-sort-by="defaultSortBy"
      :paging="paging"
      :search="search"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    />
  </div>
</template>
