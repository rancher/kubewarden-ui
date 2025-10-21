<template>
  <div class="fix-available-cell">
    <i
      :class="row.fixAvailable ? 'icon icon-confirmation-alt' : 'icon icon-notify-error'"
      :style="{
        color: row.fixAvailable ? '#007cba' : '#E2E3EB',
        fontSize: '1.5rem'
      }"
    ></i>
    <span v-if="row.fixAvailable && row.fixVersion">{{ row.fixVersion }}</span>
  </div>
</template>

<script>
export default {
  props: {
    row: {
      type:     Object,
      required: true
    }
  }
};
</script>

<style scoped>
.fix-available-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
