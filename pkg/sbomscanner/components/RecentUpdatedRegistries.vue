<template>
  <div class="chart-section">
    <div class="title">
      {{ t('imageScanner.registries.recentUpdatedRegistries.title') }}
      <InfoTooltip :tooltip="t('imageScanner.registries.recentUpdatedRegistries.tooltip')" />
    </div>
    <div class="status-list">
      <RegistryStatusUpdate
        v-for="(registryStatus, index) in registryStatusList"
        :key="index"
        :registry-status="registryStatus"
      />
    </div>
  </div>
</template>

<script>
import RegistryStatusUpdate from '@sbomscanner/components/common/RegistryStatusUpdate';
import InfoTooltip from '@sbomscanner/components/common/Tooltip';

export default {
  name:       'RecentUpdatedRegistries',
  components: { RegistryStatusUpdate, InfoTooltip },
  props:      {
    registryStatusList: {
      type:     Array,
      required: true
    }
  },
};
</script>

<style lang="scss" scoped>
    .chart-section {
        display: flex;
        padding: 16px;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        flex: 1 0 0;
        border-right: solid var(--border-width) var(--input-border);
        .title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: Lato;
            font-size: 18px;
            font-style: normal;
            font-weight: 400;
            line-height: 21px; /* 116.667% */
            margin-right: 8px;
        }
        .status-list {
            padding: 4px 8px;
            align-items: center;
            align-self: stretch;
        }
    }
</style>
