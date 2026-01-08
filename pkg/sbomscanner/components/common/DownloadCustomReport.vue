<template>
  <button
    class="btn role-primary"
    :disabled="!(selectedRows && selectedRows.length)"
    @click="downloadFn()"
  >
    <i class="icon icon-download"></i>
    {{ buttonName }}
  </button>
</template>

<script>

export default {
  name:  'ScanButton',
  props: {
    selectedRows: {
      type:    Array,
      default: () => []
    },
    buttonName: {
      type:    String,
      default: ''
    },
    downloadFn: {
      type:    Function,
      default: null
    }
  },
  methods: {},
};
</script>
