<template>
  <div
    class="badge"
    :class="statusClass"
  >
    <div class="text">
      {{ t(`imageScanner.enum.status.${enabled? 'enabled' : 'disabled'}`) }}
    </div>
  </div>
</template>

<script>
import { VEX_STATUS } from '@pkg/types';
export default {
  name:     'VexStatusBadge',
  props:    { enabled: { type: Boolean } },
  computed: {
    statusClass() {
      return this.enabled ? VEX_STATUS.ENABLED : VEX_STATUS.DISABLED;
    }
  }
};
</script>

<style lang="scss" scoped>
.badge {
  display: inline-block;
  padding: 1px 8px;
  align-items: center;
  border-radius: 30px;

  &.enabled {
    background: #DEEFDC;
    color: #376930;
  }

  &.disabled {
    background: #DE2136;
    color: #FFFFFF;
  }

  .text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: Lato;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 19px;
  }
}
</style>
