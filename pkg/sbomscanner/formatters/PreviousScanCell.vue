<script>
import ProgressCell from '@sbomscanner/formatters/ProgressCell';
import TextWithPoppedDetail from '@sbomscanner/components/common/TextWithPoppedDetail';
export default {
  components: {
    ProgressCell,
    TextWithPoppedDetail
  },
  name:  'PreviousScanCell',
  props: {
    value: {
      type:     Object,
      required: true
    },
    row: {
      type:     Object,
      required: true
    }
  },
  computed: {
    getStatusText() {
      return this.value.prevScanStatus ? this.t(`imageScanner.enum.status.${ this.value.prevScanStatus.toLowerCase() }`) : '';
    },
    getStatusLabelClass() {
      return this.value.prevScanStatus ? this.value.prevScanStatus.toLowerCase() : '';
    },
    getStatusDotClass() {
      return this.value.prevScanStatus ? `dot ${ this.value.prevScanStatus.toLowerCase() }` : '';
    }
  }
};
</script>

<template>
  <div class="previous-scan-cell">
    <div :class="getStatusDotClass"></div>
    <div
      class="status"
      :class="getStatusLabelClass"
    >
      {{ getStatusText }}
    </div>
    <div v-if="value.prevProgress">
      <span>{{ t("imageScanner.general.at") }}</span><ProgressCell
        style="display: inline-block;"
        :value="{ metadata: { name: row.metadata.name }, progress: value.prevProgress, progressDetail: value.prevProgressDetail, error: null}"
      />
    </div>
    <div v-if="value.prevScanStatus?.toLowerCase() === 'failed' && value.prevError">
      <span>|
        <TextWithPoppedDetail
          :value="t('imageScanner.general.error')"
          :detail="{ title: `${row.metadata.name} - ${t('imageScanner.registries.configuration.scanTable.header.error')}`, message: value.prevError, type: 'error' }"
        />
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
    @import '../styles/_variables.scss';

    .previous-scan-cell {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);
        font-size: 14px;
        .status {
            font-size: 14px;
            &.none {
                color: var(--muted);
            }
        }
        .dot {
            width: 8px;
            height: 8px;
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
                border-color: var(--badge-state-disabled-border);
            }

        }
        --status-pending: #{$pending-color};
        --status-scheduled: #{$scheduled-color};
        --status-inprogress: #{$inprogress-color};
        --status-complete: #{$completed-color};
        --status-failed: #{$failed-color};
        --status-none: #FFFFFF;
    }
</style>
