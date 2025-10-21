<template>
  <div
    class="badge"
    :class="statusClass"
  >
    <div
      v-if="status"
      class="text"
      :class="statusClass"
    >
      {{ t(`imageScanner.enum.status.${status.toLowerCase()}`) }}
    </div>
  </div>
</template>

<script>
import { REGISTRY_STATUS, VEX_STATUS } from '@pkg/types';
export default {
  name:  'StatusBadge',
  props: {
    status: {
      type:    String,
      default: '0'
    },
  },
  computed: {
    statusClass() {
      switch (this.status) {
      case REGISTRY_STATUS.PENDING:
        return 'pending';
      case REGISTRY_STATUS.SCHEDULED:
        return 'scheduled';
      case REGISTRY_STATUS.IN_PROGRESS:
        return 'in-progress';
      case REGISTRY_STATUS.COMPLETE:
        return 'complete';
      case REGISTRY_STATUS.FAILED:
        return 'failed';
      case VEX_STATUS.DISABLED:
        return 'disabled';
      case VEX_STATUS.ENABLED:
        return 'enabled';
      default:
        return 'none';
      }
    }
  }
};
</script>

<style lang="scss" scoped>
  .badge {
    /* layout */
    display: inline-block;
    padding: 1px 8px;
    align-items: center;
    /* style */
    border-radius: 30px;

    &.pending {
      background: #EDEFF3;
      color: #6C6C76;
    }

    &.scheduled {
      background: #CDF5FC;
      color: #097C90;
    }

    &.in-progress {
      background: #D8EAF6;
      color: #1C577D;
    }

    &.complete {
      background: #DEEFDC;
      color: #376930;
    }

    &.failed{
      background: #DE2136;
      color: #FFFFFF;
    }

    &.disabled{
      background: #DE2136;
      color: #FFFFFF;
    }

    &.enabled{
      background: #DEEFDC;
      color: #376930;
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
      &.none {
        color: var(--muted);
      }
    }
  }
</style>
