<template>
  <div class="page">
    <div class="header-section">
      <div class="title">
        {{ t('imageScanner.dashboard.title') }}
        <div class="description">
          {{ t('imageScanner.dashboard.subtitle') }} {{ displayedCurrDate }}&nbsp;&nbsp;&nbsp;&nbsp;{{ displayedCurrTime }}
        </div>
      </div>
      <div class="filter-dropdown">
        <LabeledSelect
          v-model:value="selectedRegistry"
          :options="registryOptions"
          :close-on-select="true"
          :multiple="false"
        />
      </div>
    </div>

    <div class="summary-section">
      <!-- <div class="summary-panel">
        <div class="panel-header">
          <div class="header-left">
            <h3>Affecting vulnerabilities distribution</h3>
            <i class="icon icon-question-mark" style="margin-left: .5rem;"></i>
          </div>
          <div class="header-right">
            <span class="total-count">2.584 vulnerabilities in total</span>
          </div>
        </div>
        <div class="panel-content">
          <ImageRiskAssessment :chartData="affectingVulnerabilitiesData" />
        </div>
      </div> -->
      <div class="summary-panel">
        <div class="panel-header">
          <div class="header-left">
            <h3>{{ t('imageScanner.dashboard.scanningStatus.title') }}</h3>
            <i
              class="icon icon-question-mark"
              style="margin-left: .5rem;"
              v-clean-tooltip="tooltip"
            ></i>
          </div>
          <div class="header-right">
            <span class="total-count">{{ displayedTotalScannedImageCnt }} {{ t('imageScanner.dashboard.scanningStatus.totalImages') }}</span>
          </div>
        </div>
        <div class="panel-content">
          <div class="scanning-stats">
            <div class="scan-stat">
              <div class="scan-value">
                {{ durationFromLastScan }}
              </div>
              <div
                v-if="scaningStats.lastCompletionTimestamp > 0"
                class="scan-label"
              >
                {{ t('imageScanner.dashboard.scanningStatus.durationSubtitle') }}
              </div>
            </div>
            <div class="scan-stat failed">
              <div class="scan-value">
                {{ displayedFailedImagesCnt }}
              </div>
              <div class="scan-label">
                {{ t('imageScanner.dashboard.scanningStatus.imageCntSubtitle') }}
              </div>
            </div>
            <div class="scan-stat error">
              <div class="scan-value">
                {{ displayedDetectedErrorCnt }}
              </div>
              <div class="scan-label">
                {{ t('imageScanner.dashboard.scanningStatus.errorSubtitle') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- <div class="summary-section">
      <div class="summary-panel">
        <div class="panel-header">
          <div class="header-left">
            <h3>Most severe, affecting vulnerabilities</h3>
            <i class="icon icon-question-mark" style="margin-left: .5rem;"></i>
          </div>
          <div class="header-right">
            <span class="total-count">CVE ID, Score, Affected images</span>
          </div>
        </div>
        <div>
          <TopSevereVulnerabilitiesChart
            :topSevereVulnerabilities="displayedVulnerabilities"
          />
          <div v-if="shouldShowVulnerabilitiesViewAll" class="view-all-inline">
            <RouterLink style="margin-left: 32px;" class="view-all" :to="`/c/${this.$route.params.cluster}/${ this.PRODUCT_NAME }/${this.PAGE.VULNERABILITIES}`">View all</RouterLink>
          </div>
        </div>
      </div>
      <div class="summary-panel">
        <div class="panel-header">
          <div class="header-left">
            <h3>Most affected images at risk</h3>
            <i class="icon icon-question-mark" style="margin-left: .5rem;"></i>
          </div>
          <div class="header-right">
            <span class="total-count">Image name, Affecting CVEs</span>
          </div>
        </div>
        <div class="panel-content">
          <TopRiskyImagesChart :topRiskyImages="displayedImages" />
          <div v-if="shouldShowImagesViewAll" class="view-all-inline">
            <RouterLink style="margin-left: 16px;" class="view-all" :to="`/c/${this.$route.params.cluster}/${ this.PRODUCT_NAME }/${this.PAGE.IMAGES}`">View all</RouterLink>
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script>
import { RESOURCE, PRODUCT_NAME, PAGE } from '@pkg/types';
// import SevereVulnerabilitiesItem from '@pkg/components/common/SevereVulnerabilitiesItem.vue';
// import TopSevereVulnerabilitiesChart from '@pkg/components/TopSevereVulnerabilitiesChart';
// import ImageRiskAssessment from '@pkg/components/ImageRiskAssessment';
// import TopRiskyImagesChart from '@pkg/components/TopRiskyImagesChart';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import day from 'dayjs';

export default {
  name:       'Dashboard',
  components: {
    // SevereVulnerabilitiesItem,
    // TopSevereVulnerabilitiesChart,
    // ImageRiskAssessment,
    // TopRiskyImagesChart,
    LabeledSelect,
  },
  data() {
    return {
      PRODUCT_NAME,
      PAGE,
      scanJobsCRD:  [],
      scaningStats: {
        totalScannedImageCnt:    0,
        detectedErrorCnt:        0,
        failedImagesCnt:         0,
        lastCompletionTimestamp: 0,
      },
      disabled:         false,
      // lastUpdatedTime: '',
      selectedRegistry: 'All registries',
      tooltip:          this.t('imageScanner.dashboard.scanningStatus.tooltip'),
      // vulnerabilityStats: {
      //   critical: 0,
      //   high: 0,
      //   medium: 0,
      //   low: 0,
      //   none: 0,
      //   total: 0,
      //   affecting: 0
      // },
      // scanningStats: {
      //   totalImages: 0,
      //   failedScans: 0,
      //   errors: 0
      // },
      // topVulnerabilities: [],
      // showAllVulnerabilities: false,
      // showAllImages: false,
      // mostAffectedImages: [
      //   {
      //     imageName: 'struts-attacher:1.0',
      //     cveCnt: { critical: 128, high: 12, medium: 81, low: 526, none: 126 }
      //   },
      //   {
      //     imageName: 'imagemagick4.8.5613',
      //     cveCnt: { critical: 7, high: 0, medium: 1028, low: 24, none: 0 }
      //   },
      //   {
      //     imageName: 'centos7.7.1908',
      //     cveCnt: { critical: 72, high: 0, medium: 164, low: 0, none: 0 }
      //   },
      //   {
      //     imageName: 'nginx1.19.10',
      //     cveCnt: { critical: 150, high: 5, medium: 850, low: 600, none: 0 }
      //   },
      //   {
      //     imageName: 'docker-compose:1.29.2',
      //     cveCnt: { critical: 35, high: 2, medium: 450, low: 120, none: 0 }
      //   },
      //   {
      //     imageName: 'kubernetes:v1.22.6',
      //     cveCnt: { critical: 25, high: 8, medium: 320, low: 180, none: 0 }
      //   }
      // ],
      // affectingVulnerabilitiesData: {
      //   critical: 120,
      //   high: 54,
      //   medium: 23,
      //   low: 65,
      //   none: 200
      // },
      // severityDistribution: null,
      // vulnerabilities: []
    };
  },
  beforeUnmount() {
    clearInterval(this.keepAliveTimer);
  },
  computed: {
    displayedCurrDate() {
      return day(new Date().getTime()).format('MMM D, YYYY');
    },
    displayedCurrTime() {
      return day(new Date().getTime()).format('h:mm a');
    },
    displayedDetectedErrorCnt() {
      const suffix = this.scaningStats.detectedErrorCnt > 1 ? 'errors' : 'error';

      return `${ this.scaningStats.detectedErrorCnt } ${ suffix }`;
    },
    displayedFailedImagesCnt() {
      const suffix = this.scaningStats.failedImagesCnt > 1 ? 'images' : 'image';

      return `${ this.scaningStats.failedImagesCnt } ${ suffix }`;
    },
    displayedTotalScannedImageCnt() {
      const suffix = this.scaningStats.totalScannedImageCnt > 1 ? 'images' : 'image';

      return `${ this.scaningStats.totalScannedImageCnt } ${ suffix }`;
    },
    durationFromLastScan() {
      if (this.scaningStats.lastCompletionTimestamp === 0) {
        return this.t('imageScanner.dashboard.scanningStatus.initialDuration');
      }
      const now = Date.now();
      const diffMs = now - this.scaningStats.lastCompletionTimestamp;
      const diffSec = Math.floor(diffMs / 1000);

      if (Math.abs(diffSec) < 60) {
        return diffSec > 1 ? `${ diffSec } seconds` : `${ diffSec } second`;
      }

      const diffMin = Math.floor(diffSec / 60);

      if (Math.abs(diffMin) < 60) {
        return diffMin > 1 ? `${ diffMin } minutes` : `${ diffMin } minute`;
      }

      const diffHours = Math.floor(diffMin / 60);

      if (Math.abs(diffHours) < 24) {
        return diffHours > 1 ? `${ diffHours } hours` : `${ diffHours } hour`;
      }

      const diffDays = Math.floor(diffHours / 24);

      return diffDays > 1 ? `${ diffDays } days` : `${ diffDays } day`;
    },
    // displayedVulnerabilities() {
    //   if (this.showAllVulnerabilities) {
    //     return this.topVulnerabilities;
    //   }
    //   return this.topVulnerabilities.slice(0, 10);
    // },
    // displayedImages() {
    //   if (this.showAllImages) {
    //     return this.mostAffectedImages;
    //   }
    //   return this.mostAffectedImages.slice(0, 10);
    // },
    // shouldShowVulnerabilitiesViewAll() {
    //   return this.topVulnerabilities.length >= 10;
    // },
    // shouldShowImagesViewAll() {
    //   return this.mostAffectedImages.length >= 10;
    // },
    registryOptions() {
      const optionSet = new Set();

      optionSet.add('All registries');
      this.scanJobsCRD.forEach((scanjob) => {
        optionSet.add(`${ scanjob.metadata.namespace }/${ scanjob.spec.registry }`);
      });

      return Array.from(optionSet);
    },
  },
  async fetch() {
    this.scanJobsCRD = await this.$store.dispatch('cluster/findAll', { type: RESOURCE.SCAN_JOB });
    this.loadData(false);
    clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = setInterval(async() => {
      this.loadData(true);
    }, 20 * 1000);
  },
  watch: {
    selectedRegistry() {
      this.scaningStats = this.getScaningStats();
    }
  },
  methods: {
    loadData(isReloading) {
      if (isReloading) {
        this.scanJobsCRD = this.$store.getters['cluster/all'](RESOURCE.SCAN_JOB);
      }
      this.scaningStats = this.getScaningStats();
    },
    getScaningStats() {
      let lastCompletionTimestamp = 0;
      let failedImagesCnt = 0;
      let detectedErrorCnt = 0;
      let totalScannedImageCnt = 0;

      this.scanJobsCRD.filter((scanjob) => {
        return this.selectedRegistry === `${ scanjob.metadata.namespace }/${ scanjob.spec.registry }` || this.selectedRegistry === 'All registries';
      }).forEach((scanjob) => {
        totalScannedImageCnt += (scanjob.status.scannedImagesCount || 0);
        detectedErrorCnt += (scanjob.status.conditions ? (scanjob.status.conditions.find((condition) => condition.error) ? 1 : 0) : 0);
        failedImagesCnt += this.getFailedImageCnt(scanjob);
        lastCompletionTimestamp = Math.max(lastCompletionTimestamp, scanjob.status.completionTime ? new Date(scanjob.status.completionTime).getTime() : 0);
      });

      return {
        totalScannedImageCnt,
        detectedErrorCnt,
        failedImagesCnt,
        lastCompletionTimestamp,
      };
    },
    getFailedImageCnt(scanjob) {
      if (scanjob.status.conditions && scanjob.status.conditions.find((condition) => condition.error)) {
        return (scanjob.imagesCount || 0) - (scanjob.scannedImagesCount || 0);
      }

      return 0;
    },
    // toggleVulnerabilitiesView() {
    //   this.showAllVulnerabilities = !this.showAllVulnerabilities;
    // },
    // toggleImagesView() {
    //   this.showAllImages = !this.showAllImages;
    // },
    // async loadRegistryOptions() {
    //   try {
    //     // Load registry data
    //     await this.$store.dispatch('cluster/findAll', { type: RESOURCE.REGISTRY });
    //     const registries = this.$store.getters['cluster/all']?.(RESOURCE.REGISTRY) || [];

    //     // Build registry options
    //     this.registryOptions = [
    //       { label: 'All registries', value: 'all' }
    //     ];

    //     registries.forEach(registry => {
    //       this.registryOptions.push({
    //         label: registry.metadata?.name || registry.spec?.uri || 'Unknown Registry',
    //         value: registry.metadata?.name || registry.metadata?.uid
    //       });
    //     });
    //   } catch (error) {
    //     console.error('Error loading registry options:', error);
    //   }
    // },

    // async loadDashboardData() {
    //   try {
    //     // Load vulnerability data from the same source as Vulnerabilities page
    //     this.severityDistribution = severityDistribution;
    //     const totalVulnerabilities = Object.values(this.severityDistribution).reduce((sum, value) => sum + value, 0);
    //     this.vulnerabilities = cves.map(vul => ({
    //       ...vul,
    //       spec: {
    //         ...vul.spec,
    //         totalImages: totalVulnerabilities
    //       }
    //     }));

    //     // Process vulnerability statistics from severity distribution
    //     this.processVulnerabilityStats();

    //     // Set affecting vulnerabilities data for the chart
    //     this.affectingVulnerabilitiesData = {
    //       critical: 120,
    //       high: 54,
    //       medium: 23,
    //       low: 65,
    //       none: 200
    //     };

    //     // Process scanning statistics
    //     await this.processScanningStats();

    //     // Load top vulnerabilities with exact data from the image
    //     this.topVulnerabilities = [
    //       {
    //         metadata: { name: 'CVE-2017-5337' },
    //         spec: { scoreV3: 9.9, impactedImages: 2103, totalImages: 1000 }
    //       },
    //       {
    //         metadata: { name: 'CVE-2018-1000007' },
    //         spec: { scoreV3: 9.6, impactedImages: 57, totalImages: 1000 }
    //       },
    //       {
    //         metadata: { name: 'CVE-2019-10989' },
    //         spec: { scoreV2: 8.8, impactedImages: 86, totalImages: 1000 }
    //       },
    //       {
    //         metadata: { name: 'CVE-2020-0601' },
    //         spec: { scoreV3: 8.8, impactedImages: 29, totalImages: 1000 }
    //       },
    //       {
    //         metadata: { name: 'CVE-2021-22918' },
    //         spec: { scoreV3: 8.8, impactedImages: 7, totalImages: 1000 }
    //       },
    //       {
    //         metadata: { name: 'CVE-2022-22963' },
    //         spec: { scoreV3: 9.3, impactedImages: 14, totalImages: 1000 }
    //       },
    //       {
    //         metadata: { name: 'CVE-2022-23943' },
    //         spec: { scoreV3: 8.5, impactedImages: 22, totalImages: 1000 }
    //       },
    //       {
    //         metadata: { name: 'CVE-2022-26134' },
    //         spec: { scoreV3: 7.5, impactedImages: 33, totalImages: 1000 }
    //       },
    //       {
    //         metadata: { name: 'CVE-2023-24520' },
    //         spec: { scoreV3: 9.0, impactedImages: 10, totalImages: 1000 }
    //       },
    //       {
    //         metadata: { name: 'CVE-2023-29552' },
    //         spec: { scoreV3: 8.9, impactedImages: 5, totalImages: 1000 }
    //       },
    //       {
    //         metadata: { name: 'CVE-2024-00001' },
    //         spec: { scoreV3: 8.7, impactedImages: 12, totalImages: 1000 }
    //       }
    //     ];

    //     // Load most affected images
    //     this.loadMostAffectedImages();

    //     // Update last updated time
    //     this.lastUpdatedTime = new Date().toLocaleString();

    //   } catch (error) {
    //     console.error('Error loading dashboard data:', error);
    //   }
    // },

    // processVulnerabilityStats() {
    //   // Use the same severity distribution data as Vulnerabilities page
    //   this.vulnerabilityStats = {
    //     critical: this.severityDistribution.critical || 0,
    //     high: this.severityDistribution.high || 0,
    //     medium: this.severityDistribution.medium || 0,
    //     low: this.severityDistribution.low || 0,
    //     none: this.severityDistribution.none || 0,
    //     total: Object.values(this.severityDistribution).reduce((sum, value) => sum + value, 0)
    //   };

    //   // Calculate affecting vulnerabilities (total minus none)
    //   this.vulnerabilityStats.affecting = this.vulnerabilityStats.total - this.vulnerabilityStats.none;
    // },

    // async processScanningStats() {
    //   try {
    //     // Load scan job data
    //     await this.$store.dispatch('cluster/findAll', { type: RESOURCE.SCAN_JOB });
    //     const scanJobs = this.$store.getters['cluster/all']?.(RESOURCE.SCAN_JOB) || [];

    //     this.scanningStats = {
    //       totalImages: scanJobs.length,
    //       failedScans: scanJobs.filter(job => job.status?.statusResult?.type === 'Failed').length,
    //       errors: scanJobs.filter(job => job.status?.statusResult?.message).length
    //     };
    //   } catch (error) {
    //     console.error('Error loading scanning stats:', error);
    //     this.scanningStats = {
    //       totalImages: 0,
    //       failedScans: 0,
    //       errors: 0
    //     };
    //   }
    // },

    // loadMostAffectedImages() {
    //   // Mock data for now - in real implementation, this would come from image data
    //   this.mostAffectedImages = [
    //     {
    //       imageName: 'struts-attacher:1.0',
    //       cveCnt: { critical: 128, high: 12, medium: 81, low: 526, none: 126 }
    //     },
    //     {
    //       imageName: 'imagemagick4.8.5613',
    //       cveCnt: { critical: 7, high: 0, medium: 1028, low: 24, none: 0 }
    //     },
    //     {
    //       imageName: 'centos7.7.1908',
    //       cveCnt: { critical: 72, high: 0, medium: 164, low: 0, none: 0 }
    //     },
    //     {
    //       imageName: 'nginx1.19.10',
    //       cveCnt: { critical: 150, high: 5, medium: 850, low: 600, none: 0 }
    //     },
    //     {
    //       imageName: 'docker-compose:1.29.2',
    //       cveCnt: { critical: 35, high: 2, medium: 450, low: 120, none: 0 }
    //     },
    //     {
    //       imageName: 'kubernetes:v1.22.6',
    //       cveCnt: { critical: 200, high: 10, medium: 1200, low: 300, none: 45 }
    //     },
    //     {
    //       imageName: 'nodejs:14.17.0',
    //       cveCnt: { critical: 90, high: 3, medium: 680, low: 200, none: 32 }
    //     },
    //     {
    //       imageName: 'postgresql:13.3',
    //       cveCnt: { critical: 60, high: 1, medium: 500, low: 150, none: 25 }
    //     },
    //     {
    //       imageName: 'redis:6.2.1',
    //       cveCnt: { critical: 50, high: 0, medium: 300, low: 100, none: 15 }
    //     },
    //     {
    //       imageName: 'flask:2.0.1',
    //       cveCnt: { critical: 40, high: 2, medium: 350, low: 90, none: 12 }
    //     },
    //     {
    //       imageName: 'apache:2.4.41',
    //       cveCnt: { critical: 25, high: 8, medium: 180, low: 75, none: 8 }
    //     },
    //     {
    //       imageName: 'mysql:8.0.25',
    //       cveCnt: { critical: 15, high: 5, medium: 120, low: 45, none: 3 }
    //     }
    //   ];
    // },

    // async refresh() {
    //   this.disabled = true;
    //   try {
    //     await this.loadDashboardData();
    //   } finally {
    //     this.disabled = false;
    //   }
    // },

    // viewAllVulnerabilities() {
    //   this.$router.push({ name: `c-cluster-${PRODUCT_NAME}-${this.$store.getters['type-map/nameForId']('vulnerability_overview')}` });
    // },

    // viewAllImages() {
    //   this.$router.push({ name: `c-cluster-${PRODUCT_NAME}-${this.$store.getters['type-map/nameForId']('image_overview')}` });
    // },

    // viewVulnerabilityDetail(cveId) {
    //   // Navigate to vulnerability detail page
    //   console.log('View vulnerability detail:', cveId);
    // },

    // viewImageDetail(imageName) {
    //   // Navigate to image detail page
    //   console.log('View image detail:', imageName);
    // },

    // openAddEditRuleModal() {
    //   // Download full report functionality
    //   console.log('Download full report');
    // },

    // getSeverityPercentage(severity) {
    //   if (this.vulnerabilityStats.total === 0) return 0;
    //   return Math.round((this.vulnerabilityStats[severity] / this.vulnerabilityStats.total) * 100);
    // },

    // getSeverityClass(score) {
    //   if (score >= 9.0) return 'critical';
    //   if (score >= 7.0) return 'high';
    //   if (score >= 4.0) return 'medium';
    //   if (score >= 0.1) return 'low';
    //   return 'none';
    // },

    // getVulnerabilityBarWidth(vulnerability) {
    //   if (!this.topVulnerabilities.length) return 0;
    //   const maxImages = Math.max(...this.topVulnerabilities.map(v => v.spec.totalImages));
    //   return Math.round((vulnerability.spec.totalImages / maxImages) * 100);
    // }
  }
};
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  // padding: 24px;
  min-height: 100vh;
  // background: #f8f9fa;
}

.header-section {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  align-self: stretch;
  margin-bottom: 24px;

  .title {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 4px;
    flex: 1 0 0;
    font-family: Lato;
    font-size: 24px;
    font-style: normal;
    font-weight: 400;
    line-height: 32px; /* 133.333% */

    .description {
      color: var(--disabled-text);
      font-family: Lato;
      font-size: 16px;
      font-weight: 400;
      line-height: 24px;
    }
  }

  .filter-dropdown {
    display: flex;
    width: 225px;
    height: 40px;
  }
}

.summary-section {
  display: flex;
  gap: 24px;
  align-items: stretch;
  align-self: stretch;
  margin-bottom: 24px;
}

.summary-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--input-bg);;
  border: solid var(--border-width) var(--input-border);
  border-radius: 0px;
  box-shadow: none;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 16px 0 16px;

    .header-left {
      display: flex;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 400;
        line-height: 24px;
      }
    }

    .header-right {
      .total-count {
        color: var(--disabled-text);
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
      }
    }

    .btn-link {
      background: none;
      border: none;
      color: #007cbb;
      cursor: pointer;
      font-size: 14px;
      font-weight: 400;
      text-decoration: none;

      &:hover {
        color: #005a8b;
        text-decoration: underline;
      }
    }
  }

  .panel-content {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }

  .view-all-inline {
    margin-top: 9px;
    margin-bottom: 4px;
    text-align: left;

    .btn-link {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 400;
      text-decoration: underline;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  // .vulnerability-distribution {
  //     flex: 1;
  //     display: flex;
  //     flex-direction: column;
  //     justify-content: center;

  //     .main-stat {
  //       text-align: center;
  //       margin-bottom: 32px;

  //       .main-number {
  //         font-size: 48px;
  //         font-weight: 700;
  //         color: #141419;
  //         line-height: 56px;
  //         margin-bottom: 8px;
  //       }

  //       .main-label {
  //         font-size: 16px;
  //         color: #717179;
  //         font-weight: 400;
  //       }
  //     }

  //     .severity-breakdown {
  //       display: flex;
  //       flex-direction: column;
  //       gap: 16px;

  //       .severity-item {
  //         display: flex;
  //         align-items: center;
  //         gap: 16px;

  //         .severity-label {
  //           min-width: 60px;
  //           font-size: 14px;
  //           font-weight: 400;
  //           color: #141419;
  //         }

  //         .severity-bar {
  //           flex: 1;
  //           height: 8px;
  //           background: #f0f0f0;
  //           border-radius: 0px;
  //           overflow: hidden;

  //           .bar-fill {
  //             height: 100%;
  //             border-radius: 0px;
  //             transition: width 0.3s ease;

  //             &.critical { background: #dc2626; }
  //             &.high { background: #ea580c; }
  //             &.medium { background: #f59e0b; }
  //             &.low { background: #3b82f6; }
  //             &.none { background: #9ca3af; }
  //           }
  //         }

  //         .severity-count {
  //           min-width: 40px;
  //           text-align: right;
  //           font-size: 14px;
  //           font-weight: 400;
  //           color: #141419;
  //         }
  //       }
  //     }
  //   }

    .scanning-stats {
      flex: 1;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      gap: 32px;
      padding: 24px 0;

      .scan-stat {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
        text-align: center;

        .scan-value {
          font-size: 28px;
          font-weight: 700;
          line-height: 36px;
        }

        &.failed .scan-value {
          color: #f59e0b;
        }

        &.error .scan-value {
          color: #dc2626;
        }

        .scan-label {
          font-size: 14px;
          color: var(--disabled-text);
          font-weight: 400;
          line-height: 20px;
        }
      }
    }

    // .vulnerability-list {
    //   flex: 1;
    //   display: flex;
    //   flex-direction: column;
    //   gap: 16px;

    //   .vulnerability-item {
    //     display: flex;
    //     align-items: center;
    //     gap: 16px;
    //     padding: 12px 0;
    //     cursor: pointer;
    //     border-bottom: 1px solid #f0f0f0;

    //     &:last-child {
    //       border-bottom: none;
    //     }

    //     &:hover {
    //       background: #f8f9fa;
    //       margin: 0 -12px;
    //       padding: 12px;
    //       border-radius: 0px;
    //     }

    //     .vuln-id {
    //       font-size: 14px;
    //       font-weight: 400;
    //       color: #141419;
    //       min-width: 120px;
    //     }

    //     .vuln-score {
    //       padding: 4px 8px;
    //       border-radius: 0px;
    //       font-size: 12px;
    //       font-weight: 400;
    //       min-width: 60px;
    //       text-align: center;

    //       &.critical { background: #fee2e2; color: #dc2626; }
    //       &.high { background: #fed7aa; color: #ea580c; }
    //       &.medium { background: #fef3c7; color: #f59e0b; }
    //       &.low { background: #dbeafe; color: #3b82f6; }
    //       &.none { background: #f3f4f6; color: #6b7280; }
    //     }

    //     .vuln-bar {
    //       flex: 1;
    //       height: 6px;
    //       background: #f0f0f0;
    //       border-radius: 0px;
    //       overflow: hidden;

    //       .bar-fill {
    //         height: 100%;
    //         background: #9ca3af;
    //         border-radius: 0px;
    //         transition: width 0.3s ease;
    //       }
    //     }

    //     .vuln-count {
    //       min-width: 40px;
    //       text-align: right;
    //       font-size: 14px;
    //       font-weight: 400;
    //       color: #141419;
    //     }
    //   }
    // }

    // .image-list {
    //   flex: 1;
    //   display: flex;
    //   flex-direction: column;
    //   gap: 16px;

    //   .image-item {
    //     display: flex;
    //     align-items: center;
    //     gap: 16px;
    //     padding: 12px 0;
    //     cursor: pointer;
    //     border-bottom: 1px solid #f0f0f0;

    //     &:last-child {
    //       border-bottom: none;
    //     }

    //     &:hover {
    //       background: #f8f9fa;
    //       margin: 0 -12px;
    //       padding: 12px;
    //       border-radius: 0px;
    //     }

    //     .image-name {
    //       font-size: 14px;
    //       font-weight: 400;
    //       color: #5696ce;
    //       min-width: 200px;
    //       flex: 1;
    //     }

    //     .image-vulnerabilities {
    //       display: flex;
    //       gap: 4px;

    //       .vuln-count {
    //         padding: 4px 8px;
    //         border-radius: 0px;
    //         font-size: 12px;
    //         font-weight: 400;
    //         min-width: 24px;
    //         text-align: center;

    //         &.critical { background: #fee2e2; color: #dc2626; }
    //         &.high { background: #fed7aa; color: #ea580c; }
    //         &.medium { background: #fef3c7; color: #f59e0b; }
    //         &.low { background: #dbeafe; color: #3b82f6; }
    //         &.none { background: #f3f4f6; color: #6b7280; }
    //       }
    //     }
    //   }
    // }
  }

  // .view-all {
  //   color: #141419;
  //   font-size: 14px;
  //   font-weight: 400;
  //   text-decoration: underline;
  //   cursor: pointer;
  // }

// Override TopSevereVulnerabilitiesChart styling for Dashboard
// .summary-panel {
//   :deep(.chart-section) {
//     border-right: none !important;
//     flex: none !important;
//     padding: 0 !important;
//     margin-bottom: 0 !important;
//     height: auto !important;
//     display: flex;
//     flex-direction: column;
//     background: transparent !important;
//     border: none !important;
//   }

//   :deep(.vulnerability-record) {
//     padding: 8px 16px !important;
//     margin-bottom: 3px !important;
//   }

//   :deep(.cve) {
//     color: #007cbb !important;
//     text-decoration: none !important;
//     cursor: pointer !important;

//     &:hover {
//       color: #005a8b !important;
//       text-decoration: underline !important;
//     }
//   }
// }

// // Override ImageRiskAssessment styling for Dashboard
// .summary-panel {
//   :deep(.chart-section) {
//     border-right: none !important;
//     flex: none !important;
//     padding: 0 !important;
//     height: 100%;
//     display: flex;
//     flex-direction: column;
//     background: transparent !important;
//     border: none !important;
//     border-radius: 0px;
//     box-shadow: none;

//     .title {
//       display: none !important;
//     }
//   }

//   :deep(.chart-area) {
//     border-right: none !important;
//     flex: none !important;
//     padding: 0 !important;
//     margin-bottom: 0 !important;
//     height: auto !important;
//     display: flex;
//     flex-direction: column;
//     background: transparent !important;
//     border: none !important;
//     border-radius: 0px;
//     box-shadow: none;

//     .title {
//       display: none !important;
//     }
//   }
// }

// Responsive design
@media (max-width: 1200px) {
  .summary-section {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .header-section {
    flex-direction: column;
    gap: 16px;

    .header-right {
      width: 100%;
      justify-content: space-between;
    }
  }

  .summary-panel {
    padding: 16px;
  }
}
</style>
