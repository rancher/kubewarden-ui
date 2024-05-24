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
      // Wait until the next tick to ensure the table is rendered
      this.$nextTick(() => {
        const table = this.$refs.sortableTable.$el.querySelector('table');

        if ( table ) {
          table.querySelectorAll('tbody tr').forEach((row, index) => {
            row.addEventListener('click', () => {
              this.$emit('selectRow', this.rows[index]);
            });
          });
        }
      });
    },
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
