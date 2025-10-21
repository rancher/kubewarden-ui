<script>
import ProgressCell from '@pkg/formatters/ProgressCell';
import TextWithPopedDetail from '@pkg/components/common/TextWithPopedDetail';
export default {
  components: {
    ProgressCell,
    TextWithPopedDetail
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
        <TextWithPopedDetail
          :value="t('imageScanner.general.error')"
          :detail="{ title: `${row.metadata.name} - ${t('imageScanner.registries.configuration.scanTable.header.error')}`, message: value.prevError, type: 'error' }"
        />
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
