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
import { REGISTRY_STATUS, VEX_STATUS } from '@sbomscanner/types';
export default {
  name:  'StatusBadge',
  props: {
    status: {
      type:    String,
      default: ''
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
  @import '../../styles/_variables.scss';

  .badge {
    /* layout */
    display: inline-block;
    padding: 1px 8px;
    align-items: center;
    /* style */
    border-radius: 30px;

    &.pending {
      background: rgba($pending-color, 0.3);
      color: rgba(black, 0.65);
      body.theme-dark & {
        color: rgba(white, 0.65);
      }
    }

    &.scheduled {
      background: rgba($scheduled-color, 0.3);
      color: rgba(black, 0.65);
      body.theme-dark & {
        color: rgba(white, 0.65);
      }
    }

    &.in-progress {
      background: rgba($inprogress-color, 0.3);
      color: rgba(black, 0.65);
      body.theme-dark & {
        color: rgba(white, 0.65);
      }
    }

    &.complete {
      background: rgba($completed-color, 0.3);
      color: rgba(black, 0.65);
      body.theme-dark & {
        color: rgba(white, 0.65);
      }
    }

    &.failed{
      background: $failed-color;
      color: white;
    }

    &.disabled{
      background: $failed-color;
      color: white;
    }

    &.enabled{
      background: rgba($completed-color, 0.3);
      color: rgba(black, 0.65);
      body.theme-dark & {
        color: rgba(white, 0.65);
      }
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
