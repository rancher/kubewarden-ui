<script>
import { REGISTRY_STATUS } from '@pkg/types';

export default {
  props: {
    value: {
      type:     String,
      required: true
    },
    row: {
      type:     Object,
      required: true
    }
  },
  computed: {
    error() {
      const statusResult = this.value.conditions?.find((condition) => {
        return condition.status === 'True';
      });

      return statusResult?.type.toLowerCase() === REGISTRY_STATUS.FAILED ? statusResult.message : null;
    }
  },
};
</script>

<template>
  <div
    v-if="error"
    class="scan-error-cell"
  >
    <div class="dot failed"></div>
    <div class="status">
      {{ error }}
    </div>
  </div>
  <div
    v-else
    class="scan-error-cell"
  >
    <div class="status text-muted">
      {{ t('imageScanner.general.none') }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
    .scan-error-cell {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        color: var(--text-secondary);
        font-size: 14px;
        .status {
          font-size: 14px;
        }
        .dot {
            width: 8px;
            height: 8px;
            min-width: 8px;
            margin-top: 4px;
            border-radius: 50%;
            border-width: 1px;
            border-style: solid;
            display: inline-block;
            &.pending {
                background-color: var(--status-pending);
                border-color: var(--status-pending);
            }
            &.scheduled {
                background-color: var(--status-scheduled);
                border-color: var(--status-scheduled);
            }
            &.inprogress {
                background-color: var(--status-inprogress);
                border-color: var(--status-inprogress);
            }
            &.complete {
                background-color: var(--status-complete);
                border-color: var(--status-complete);
            }
            &.failed {
                background-color: var(--status-failed);
                border-color: var(--status-failed);
            }
            &.none {
                background-color: var(--status-none);
                border-color: #DCDEE4;
            }

            --status-pending: #DCDEE7;
            --status-scheduled: #0FCFF0;
            --status-inprogress: #3D98D3;
            --status-complete: #5BB04F;
            --status-failed: #DE2136;
            --status-none: #FFFFFF;
        }
    }
</style>
