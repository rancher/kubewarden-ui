<template>
  <div class="chart-section">
    <div class="title">
      {{ t('imageScanner.vulnerabilities.vulnerabilitiesBySeverityChart.title') }}
    </div>
    <div class="vulnerability-list">
      <SevereVulnerabilitiesItem
        v-for="(vulnerability, index) in topSevereVulnerabilities"
        :key="index"
        :vulnerability="vulnerability"
      />
    </div>
  </div>
</template>

<script>
import SevereVulnerabilitiesItem from './common/SevereVulnerabilitiesItem.vue';

export default {
  name:       'TopSevereVulnerabilitiesChart',
  components: { SevereVulnerabilitiesItem },
  props:      {
    topSevereVulnerabilities: {
      type:     Array,
      required: true
    },
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
    border-right: 1px solid #DCDEE7;
    .title {
      color: #141419;
      font-family: Lato;
      font-size: 18px;
      font-style: normal;
      font-weight: 400;
      line-height: 21px; /* 116.667% */
    }
    .vulnerability-list {
      display: flex;
      padding: 4px 0;
      flex-direction: column;
      align-items: flex-start;
      gap: 1px;
      align-self: stretch;
    }
  }
</style>
