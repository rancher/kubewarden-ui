<template>
  <div class="fix-available-cell">
    <FixAvailableIcon :fix-available="row.fixAvailable" />
    <span v-if="row.fixAvailable && row.fixVersion">{{ row.fixVersion }}</span>
  </div>
</template>

<script>
import FixAvailableIcon from '@sbomscanner/components/common/FixAvailableIcon';

export default {
  components: { FixAvailableIcon },
  props:      {
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
