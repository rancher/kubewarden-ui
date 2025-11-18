<template>
  <div class="page">
    <div class="header-section">
      <div class="title">
        {{ t("imageScanner.vulnerabilities.title") }}
      </div>
      <div class="filter-dropdown">
        <LabeledSelect
          v-model:value="selectedImageFilter"
          :options="filterImageOptions"
          @update:value="updateFilter"
        />
      </div>
      <div>
        <button class="btn role-primary">
          <i class="icon icon-download"></i>
          {{ t('imageScanner.images.downloadReport') }}
        </button>
      </div>
    </div>
    <div class="summary-section">
      <TopSevereVulnerabilitiesChart
        :top-severe-vulnerabilities="topSevereVulnerabilities"
      />
      <DistributionChart
        :chart-data="severityDistribution"
        :title="t('imageScanner.vulnerabilities.severityDistribution.title')"
        color-prefix="severity"
        :description="t('imageScanner.vulnerabilities.severityDistribution.subTitle')"
      />
    </div>
    <div class="table">
      <SortableTable
        :has-advanced-filtering="false"
        :namespaced="false"
        :row-actions="false"
        :table-actions="true"
        :force-update-live-and-delayed="0"
        :use-query-params-for-simple-filtering="true"
        :rows="vulnerabilities"
        :headers="VULNERABILITIES_TABLE"
        :key-field="'id'"
        @selection="onSelectionChange"
      >
        <template #header-left>
          <div class="table-top-left">
            <DownloadCustomReport
              class="table-btn"
              :selected-rows="selectedRows"
              :button-name="t('imageScanner.images.buttons.downloadCustomReport')"
            />
          </div>
        </template>
      </SortableTable>
    </div>
  </div>
</template>

<script>
import SortableTable from '@shell/components/SortableTable';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import DistributionChart from '@sbomscanner/components/DistributionChart';
import TopSevereVulnerabilitiesChart from '@sbomscanner/components/TopSevereVulnerabilitiesChart';
import DownloadCustomReport from '@sbomscanner/components/common/DownloadCustomReport';
import { VULNERABILITIES_TABLE } from '@sbomscanner/config/table-headers';

export default {
  name:       'Vulnerabilities',
  components: {
    DistributionChart,
    TopSevereVulnerabilitiesChart,
    DownloadCustomReport,
    SortableTable,
    LabeledSelect,
  },
  data() {
    const filterImageOptions = [
      { label: this.t('imageScanner.images.filters.image.allImages'), value: 'all' },
      { label: this.t('imageScanner.images.filters.image.excludeBaseImages'), value: 'excludeBase' },
      { label: this.t('imageScanner.images.filters.image.includeBaseImages'), value: 'includeBase' }
    ];

    return {
      VULNERABILITIES_TABLE,
      severityDistribution: {
        critical: 0,
        high:     0,
        medium:   0,
        low:      0,
      },
      cves:                     [],
      topSevereVulnerabilities: [],
      vulnerabilities:          [],
      selectedRows:             [],
      filterImageOptions,
      selectedImageFilter:      filterImageOptions[0].value,
    };
  },
  async fetch() {
    // await this.$store.dispatch('sbomscanner/load');
    const totalVulnerabilities = Object.values(this.severityDistribution).reduce((sum, value) => sum + value, 0);

    this.vulnerabilities = this.cves.map((vul) => ({
      ...vul,
      spec: {
        ...vul.spec,
        totalImages: totalVulnerabilities
      }
    }));
    this.updateFilter(this.selectedImageFilter);
    this.topSevereVulnerabilities = this.vulnerabilities.sort((a, b) => Number(b.spec.scoreV3) - Number(a.spec.scoreV3)).slice(0, 5);
  },
  methods: {
    onSelectionChange(selected) {
      this.selectedRows = selected || [];
    },
    updateFilter(value) {
      this.vulnerabilities.forEach((vul) => {
        if (value === 'all') {
          vul.spec.identifiedImages_count = vul.spec.identifiedImages.base + vul.spec.identifiedImages.nonBase;
          vul.spec.impactedImages_count = vul.spec.impactedImages.base + vul.spec.impactedImages.nonBase;
        } else if (value === 'excludeBase') {
          vul.spec.identifiedImages_count = vul.spec.identifiedImages.nonBase;
          vul.spec.impactedImages_count = vul.spec.impactedImages.nonBase;
        } else if (value === 'includeBase') {
          vul.spec.identifiedImages_count = vul.spec.identifiedImages.base;
          vul.spec.impactedImages_count = vul.spec.impactedImages.base;
        }
      });
    }
  },
};
</script>

<style lang="scss" scoped>
  .page {
    display: flex;
    padding: 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
    flex: 1 0 0;
    align-self: stretch;
  }

  .header-section {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    align-self: stretch;

    .title {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 4px;
      flex: 1 0 0;
      color: #141419;
      font-family: Lato;
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      line-height: 32px; /* 133.333% */
    }

    .filter-dropdown {
      display: flex;
      width: 225px;
      height: 40px;
    }
  }

  .summary-section {
    display: flex;
    min-width: 912px;
    align-items: flex-start;
    align-self: stretch;
    border-radius: 6px;
    border: 1px solid #DCDEE7;
    background: #FFF;
  }

  .table {
    width: 100%;
  }
</style>
