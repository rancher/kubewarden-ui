<script>
import SortableTable from '@shell/components/SortableTable';

export default {
  props:      {
    rows:          { type: Array, required: true },
    headers:       { type: Array, required: true },
    tableActions:  { type: Boolean, default: false },
    rowActions:    { type: Boolean, default: false },
    keyField:      { type: String, required: true },
    defaultSortBy: { type: String, default: '' },
    paging:        { type: Boolean, default: false },
    search:        { type: Boolean, default: false }
  },

  components: { SortableTable },

  data() {
    return { listeners: [] };
  },

  watch: {
    rows() {
      this.addRowClickListener();
    }
  },

  mounted() {
    this.addRowClickListener();
  },

  methods: {
    addRowClickListener() {
      this.$nextTick(() => {
        const table = this.$refs.sortableTable?.$el?.querySelector('table');

        if ( table ) {
          this.removeRowClickListener();

          table.querySelectorAll('tbody tr').forEach((row, index) => {
            const listener = () => this.$emit('selectRow', this.rows[index]);

            row?.addEventListener('click', listener);
            this.listeners.push({ row, listener });
          });
        }
      });
    },

    removeRowClickListener() {
      this.listeners?.forEach(({ row, listener }) => row?.removeEventListener('click', listener));
      this.listeners = [];
    }
  }
};
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
    />
  </div>
</template>
