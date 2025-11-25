<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="page">
    <!-- Header Section -->
    <div class="header-meta">
      <div class="header-section">
        <h1 class="title">
          <RouterLink
            class="resource-link"
            :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${PAGE.IMAGES}`"
          >
            {{ t('imageScanner.images.title') }}:
          </RouterLink>
          <span class="resource-header-name">
            {{ displayImageName }}
          </span>
          <BadgeState
            :color="overallSeverity"
            :label="t(`imageScanner.enum.cve.${overallSeverity}`)"
            class="severity-badge"
          />
        </h1>
        <div class="header-actions">
          <!-- Download SBOM Button -->
          <DownloadSBOMBtn
            :sbom="sbom"
            :image-name="imageName"
          />
          <!-- Download Full Report Dropdown -->
          <DownloadFullReportBtn
            :image-name="imageName"
            :vulnerability-details="vulnerabilityDetails"
            :vulnerability-report="vulnerabilityReport"
          />
        </div>
      </div>
      <!-- Image Information Section -->
      <RancherMeta :properties="imageDetails" />
    </div>

    <!-- Summary Section -->
    <div
      v-if="vulnerabilityDetails.length > 0"
      class="summary-section"
    >
      <!-- Most Severe Vulnerabilities Section -->
      <MostSevereVulnerabilities :vulnerability-report="loadedVulnerabilityReport" />

      <!-- Severity Distribution Section -->
      <DistributionChart
        v-if="severityDistribution"
        :title="t('imageScanner.imageDetails.severityDistribution.title')"
        :chart-data="severityDistribution"
        color-prefix="cve"
        :description="t('imageScanner.imageDetails.severityDistribution.subTitle')"
        :filter-fn="filterBySeverity"
        :tooltip="t('imageScanner.imageDetails.severityDistribution.tooltip')"
      />
    </div>

    <!-- Search Filters -->
    <div class="search-filters">
      <div class="filter-row">
        <div class="filter-item">
          <label>CVE</label>
          <div class="filter-input-wrapper">
            <input
              v-model="filters.cveSearch"
              type="text"
              placeholder="Search by ID"
              class="filter-input"
            />
            <i
              class="icon icon-search"
              style="color: #6C6C76; margin-left: 8px;"
            ></i>
          </div>
        </div>
        <div
          class="filter-item"
          style="min-width: 190px;"
        >
          <label>{{ t('imageScanner.imageDetails.score') }}</label>
          <div class="filter-input-wrapper score-range-wrapper">
            <input
              v-model="filters.scoreMin"
              type="number"
              min="0"
              max="10"
              step="0.1"
              placeholder="0"
              class="filter-input score-input"
            />
            <span class="score-separator">-</span>
            <input
              v-model="filters.scoreMax"
              type="number"
              min="0"
              max="10"
              step="0.1"
              placeholder="9.9"
              class="filter-input score-input"
            />
            <i
              class="icon icon-filter_alt"
              style="color: #6C6C76; margin-left: 8px;"
            ></i>
          </div>
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.imageDetails.table.headers.package') }}</label>
          <div class="filter-input-wrapper">
            <input
              v-model="filters.packageSearch"
              type="text"
              :placeholder="t('imageScanner.imageDetails.searchByName')"
              class="filter-input"
            />
            <i
              class="icon icon-search"
              style="color: #6C6C76; margin-left: 8px;"
            ></i>
          </div>
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.imageDetails.fixAvailable') }}</label>
          <LabeledSelect
            v-model:value="filters.fixAvailable"
            :options="filterFixAvailableOptions"
            :close-on-select="true"
            :multiple="false"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.imageDetails.severity') }}</label>
          <LabeledSelect
            v-model:value="filters.severity"
            :options="filterSeverityOptions"
            :close-on-select="true"
            :multiple="false"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.imageDetails.exploitability') }}</label>
          <LabeledSelect
            v-model:value="filters.exploitability"
            :options="filterExploitabilityOptions"
            :close-on-select="true"
            :multiple="false"
          />
        </div>
      </div>
    </div>

    <!-- Vulnerability Table -->
    <VulnerabilityTable
      :cached-filtered-vulnerabilities="cachedFilteredVulnerabilities"
      :image-name="imageName"
      :current-image="currentImage"
    />
  </div>
</template>

<script>
import { BadgeState } from '@components/BadgeState';
import { PRODUCT_NAME, RESOURCE, PAGE } from '@sbomscanner/types';
import day from 'dayjs';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Loading from '@shell/components/Loading';
import DistributionChart from '@sbomscanner/components/DistributionChart';
import RancherMeta from './common/RancherMeta.vue';
import MostSevereVulnerabilities from './common/MostSevereVulnerabilities.vue';
import VulnerabilityTable from './common/VulnerabilityTable';
import DownloadSBOMBtn from './common/DownloadSBOMBtn';
import DownloadFullReportBtn from './common/DownloadFullReportBtn.vue';
import { getHighestScore, getSeverityNum, getScoreNum } from '../utils/report';
import { constructImageName } from '@sbomscanner/utils/image';

export default {
  name:       'ImageDetails',
  components: {
    BadgeState,
    DistributionChart,
    LabeledSelect,
    RancherMeta,
    MostSevereVulnerabilities,
    VulnerabilityTable,
    DownloadSBOMBtn,
    DownloadFullReportBtn,
    Loading,
  },
  data() {
    return {
      imageName:                     '',
      loadedVulnerabilityReport:     null,
      loadedSbom:                    null,
      // Cache filtered results to prevent selection issues
      cachedFilteredVulnerabilities: [],
      // Download dropdown state
      showDownloadDropdown:          false,
      filters:                       {
        cveSearch:      '',
        scoreMin:       '',
        scoreMax:       '',
        packageSearch:  '',
        fixAvailable:   'any',
        severity:       'any',
        exploitability: 'any',
      },
      filterFixAvailableOptions: [
        { label: this.t('imageScanner.imageDetails.any'), value: 'any' },
        { label: this.t('imageScanner.imageDetails.available'), value: 'available' },
        { label: this.t('imageScanner.imageDetails.notAvailable'), value: 'not-available' },
      ],
      filterSeverityOptions: [
        { label: this.t('imageScanner.imageDetails.any'), value: 'any' },
        { label: this.t('imageScanner.enum.cve.critical'), value: 'critical' },
        { label: this.t('imageScanner.enum.cve.high'), value: 'high' },
        { label: this.t('imageScanner.enum.cve.medium'), value: 'medium' },
        { label: this.t('imageScanner.enum.cve.low'), value: 'low' },
        { label: this.t('imageScanner.enum.cve.none'), value: 'unknown' },
      ],
      filterExploitabilityOptions: [
        { label: this.t('imageScanner.imageDetails.any'), value: 'any' },
        { label: this.t('imageScanner.imageDetails.affected'), value: 'affected' },
        { label: this.t('imageScanner.imageDetails.suppressed'), value: 'suppressed' },
      ],
      PRODUCT_NAME,
      RESOURCE,
      PAGE,
    };
  },

  async fetch() {
    // Get image name from route params
    this.imageName = this.$route.params.id;

    if (!this.imageName) {
      return;
    }

    // Load the image resource and its associated data
    await this.loadImageData();
  },

  computed: {
    // Get the current image resource from Steve API
    currentImage() {
      if (!this.imageName) return null;

      // Get all images and find the one with matching name
      const allImages = this.$store.getters['cluster/all'](RESOURCE.IMAGE) || [];

      return allImages.find((img) => img.metadata.name === this.imageName);
    },

    // Display human-readable image name
    displayImageName() {
      if (!this.currentImage) return this.imageName;

      return constructImageName(this.currentImage.imageMetadata) || this.imageName;
    },

    // Get the vulnerability report for this image
    vulnerabilityReport() {
      return this.loadedVulnerabilityReport;
    },

    // Get the SBOM for this image
    sbom() {
      return this.loadedSbom;
    },

    // Get image details from the current image resource
    imageDetails() {
      if (!this.currentImage) return [];

      return [
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.vulnerabilities'),
          value: this.totalVulnerabilities
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.repository'),
          value: this.currentImage.imageMetadata?.repository || this.t('imageScanner.general.unknown'),
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.registry'),
          value: this.currentImage.imageMetadata?.registry || this.t('imageScanner.general.unknown'),
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.architecture'),
          value: this.currentImage.imageMetadata?.platform?.split('/')[0] || this.t('imageScanner.general.unknown'),
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.operatingSystem'),
          value: this.currentImage.imageMetadata?.platform?.split('/')[1] || this.t('imageScanner.general.unknown'),
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.created'),
          value: this.currentImage.metadata ? `${ day(new Date(this.currentImage.metadata?.creationTimestamp).getTime()).format('MMM D, YYYY') } ${ day(new Date(this.currentImage.metadata?.creationTimestamp).getTime()).format('h:mm a') }` : this.t('imageScanner.general.unknown'),
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.imageId'),
          value: this.currentImage.imageMetadata?.digest || this.t('imageScanner.general.unknown'),
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.layers'),
          value: this.currentImage.layers?.length || this.currentImage.spec?.layers?.length || this.t('imageScanner.general.unknown'),
        }
      ];
    },

    // Get severity distribution from vulnerability report
    severityDistribution() {
      if (!this.vulnerabilityReport) {
        return {
          critical: 0, high: 0, medium: 0, low: 0, unknown: 0
        };
      }

      return {
        critical: this.vulnerabilityReport.report.summary.critical || 0,
        high:     this.vulnerabilityReport.report.summary.high || 0,
        medium:   this.vulnerabilityReport.report.summary.medium || 0,
        low:      this.vulnerabilityReport.report.summary.low || 0,
        unknown:  this.vulnerabilityReport.report.summary.unknown || 0,
      };
    },

    // Get vulnerability details from vulnerability report
    vulnerabilityDetails() {
      if (!this.vulnerabilityReport) {
        return [];
      }

      // Try to access vulnerabilities directly from the report data
      let vulnerabilities = [];

      if (this.vulnerabilityReport.report && this.vulnerabilityReport.report.results) {
        this.vulnerabilityReport.report.results.forEach((result) => {
          if (result && result.vulnerabilities) {
            vulnerabilities = vulnerabilities.concat(result.vulnerabilities);
          }
        });
      }

      // Fallback to model's computed property
      if (vulnerabilities.length === 0) {
        vulnerabilities = this.vulnerabilityReport.vulnerabilities || [];
      }

      // Transform the vulnerability data to match the expected format
      return vulnerabilities.map((vuln, index) => {
        const score = getHighestScore(vuln.cvss);

        return ({
          id:               `${ vuln.cve }-${ vuln.packageName }-${ index }`, // Create unique ID
          cveId:            vuln.cve,
          score,
          scoreNum:         getScoreNum(score),
          package:          vuln.packageName,
          packageVersion:   vuln.installedVersion,
          packagePath:      this.getPackagePath(vuln.purl),
          fixAvailable:     vuln.fixedVersions && vuln.fixedVersions.length > 0,
          fixVersion:       vuln.fixedVersions ? vuln.fixedVersions.join(', ') : '',
          severity:         vuln.severity?.toLowerCase() || this.t('imageScanner.general.unknown'),
          severityNum:      getSeverityNum(vuln.severity),
          exploitability:   vuln.suppressed ? this.t('imageScanner.imageDetails.suppressed') : this.t('imageScanner.imageDetails.affected'),
          description:      vuln.description,
          title:            vuln.title,
          references:       vuln.references || [],
          // Add diffID for layer grouping
          diffID:           vuln.diffID,
          installedVersion: vuln.installedVersion
        });
      });
    },

    totalVulnerabilities() {
      if (!this.vulnerabilityReport) return 0;

      // Try to get vulnerabilities directly from the report data
      let vulnerabilities = [];

      if (this.vulnerabilityReport.report && this.vulnerabilityReport.report.results) {
        this.vulnerabilityReport.report.results.forEach((result) => {
          if (result && result.vulnerabilities) {
            vulnerabilities = vulnerabilities.concat(result.vulnerabilities);
          }
        });
      }

      // Fallback to model's computed property
      if (vulnerabilities.length === 0) {
        vulnerabilities = this.vulnerabilityReport.vulnerabilities || [];
      }

      return vulnerabilities.length;
    },

    overallSeverity() {
      if (!this.vulnerabilityReport) return 'none';

      const distribution = this.severityDistribution;
      const severities = ['critical', 'high', 'medium', 'low', 'none'];

      for (const severity of severities) {
        if (distribution[severity] > 0) {
          return severity;
        }
      }

      return 'none';
    },
  },

  watch: {
    // Watch for changes in vulnerability details and reset selection if needed
    vulnerabilityDetails: {
      handler(newVal, oldVal) {
        // If the data changes significantly, clear selection to prevent errors
        if (newVal && oldVal && newVal.length !== oldVal.length) {
          this.selectedVulnerabilities = [];
        }
        // Update cached filtered results
        this.updateFilteredVulnerabilities();
      },
      deep: true
    },
    // Watch for filter changes and update cache
    filters: {
      handler() {
        this.updateFilteredVulnerabilities();
      },
      deep: true
    },
  },

  methods: {

    filterBySeverity(severity) {
      this.filters.severity = severity;
    },

    updateFilteredVulnerabilities() {
      let filtered = [...this.vulnerabilityDetails];

      // CVE search filter
      if (this.filters.cveSearch && this.filters.cveSearch.trim()) {
        filtered = filtered.filter((v) => v.cveId && v.cveId.toLowerCase().includes(this.filters.cveSearch.toLowerCase())
        );
      }

      // Score range filter
      if (this.filters.scoreMin || this.filters.scoreMax) {
        filtered = filtered.filter((v) => {
          if (!v.score) return false;
          const vulnScore = parseFloat(v.score.split(' ')[0]) || 0;
          const minScore = this.filters.scoreMin ? parseFloat(this.filters.scoreMin) : 0;
          const maxScore = this.filters.scoreMax ? parseFloat(this.filters.scoreMax) : 10;

          return vulnScore >= minScore && vulnScore <= maxScore;
        });
      }

      // Package search filter
      if (this.filters.packageSearch && this.filters.packageSearch.trim()) {
        filtered = filtered.filter((v) => v.package && v.package.toLowerCase().includes(this.filters.packageSearch.toLowerCase())
        );
      }

      // Fix available filter
      if (this.filters.fixAvailable !== 'any') {
        const hasFix = this.filters.fixAvailable === 'available';

        filtered = filtered.filter((v) => v.fixAvailable === hasFix);
      }

      // Severity filter
      if (this.filters.severity !== 'any') {
        filtered = filtered.filter((v) => v.severity === this.filters.severity);
      }

      // Exploitability filter
      if (this.filters.exploitability !== 'any') {
        filtered = filtered.filter((v) => v.exploitability.toLowerCase() === this.filters.exploitability.toLowerCase());
      }
      this.cachedFilteredVulnerabilities = filtered;
    },

    async loadImageData() {
      try {
        // Try multiple approaches to load the image

        // Load all related resources from namespace
        await Promise.all([
          this.$store.dispatch('cluster/findAll', {
            type: RESOURCE.IMAGE,
            opt:  { namespace: 'sbomscanner' }
          }),
          this.$store.dispatch('cluster/findAll', {
            type: RESOURCE.VULNERABILITY_REPORT,
            opt:  { namespace: 'sbomscanner' }
          }),
          this.$store.dispatch('cluster/findAll', {
            type: RESOURCE.SBOM,
            opt:  { namespace: 'sbomscanner' }
          })
        ]);

        // Force component to re-render after data is loaded
        await this.$nextTick();

        // Find the specific image
        const allImages = this.$store.getters['cluster/all'](RESOURCE.IMAGE) || [];
        const foundImage = allImages.find((img) => img.metadata.name === this.imageName);

        if (foundImage) {
          // Find matching vulnerability report and SBOM
          const vulnReports = this.$store.getters['cluster/all'](RESOURCE.VULNERABILITY_REPORT) || [];
          const sboms = this.$store.getters['cluster/all'](RESOURCE.SBOM) || [];

          const matchingVulnReport = vulnReports.find((report) => report.metadata?.name === this.imageName
          );

          const matchingSbom = sboms.find((sbom) => sbom.metadata?.name === this.imageName
          );

          // Set the loaded resources directly
          this.loadedVulnerabilityReport = matchingVulnReport;
          this.loadedSbom = matchingSbom;

          // Force component to re-render after data properties are set
          await this.$nextTick();
          this.$forceUpdate();
        }
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: `Failed to load image data: ${ error.message }`
        }, { root: true });
      }
    },

    getPackagePath(purl) {
      const packagePaths = typeof purl === 'string' ? purl.match(/(?<=:)([^@]+?)(?=@)/) : [];

      return packagePaths && Array.isArray(packagePaths) ? packagePaths[0] : '';
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';

.page {
  display: flex;
  flex-direction: column;
  padding: 24px;
  min-height: 100%;
  gap: 24px;
}

.header-meta {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  gap: 16px;
}

.header-section {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  min-width: 740px;
}

.title {
  max-width: calc(100% - 425px);
  display: flex;
  align-items: center;
  flex-direction: row;
  .resource-header-name {
    display: inline-block;
    flex: 1;
    white-space: nowrap;
    overflow-x: hidden;
    overflow-y: clip;
    text-overflow: ellipsis;
    margin-left: 4px;
  }
}

.severity-badge {
  margin-left: 12px;
  font-size: 12px;
  font-weight: 400;
  &.critical {
      background: $critical-color;
      color: white !important;
    }

    &.high {
      background: $high-color;
      color: white !important;
    }

    &.medium {
      background: $medium-color;
      color: white !important;
    }

    &.low {
      background: $low-color;
      color: $low-na-text !important;
    }

    &.na{
      background: $na-color;
      color: $low-na-text !important;
    }

    &.none{
      background: $na-color;
      color: #717179 !important;
    }
}

.show-properties-link {
  margin-top: 0;
  padding-top: 0;
  justify-content: flex-start !important;
  grid-column: 3;
  grid-row: 4;
}

.show-properties-link a {
  color: #007cba;
  text-decoration: none;
  font-weight: 400;
  font-size: 14px;
}

.show-properties-link a:hover {
  text-decoration: underline;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #6C6C76;
}

.breadcrumb-item {
  color: #007cba;
  cursor: pointer;
}

.breadcrumb-item:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #6C6C76;
}

.summary-section {
  display: flex;
  align-items: flex-start;
  align-self: stretch;
  border-radius: 6px;
  border: solid var(--border-width) var(--input-border);
}

.severity-section {
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.cve-id {
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

.cve-link {
  color: #007cba;
  text-decoration: none;
  font-weight: 700;
}

.cve-link:hover {
  text-decoration: underline;
}

.score-badge {
  display: flex;
  align-items: center;
}

.score {
  color: #6C6C76;
  font-size: 13px;
  font-weight: 400;
  background: #E9ECEF;
  padding: 4px 8px;
  border-radius: 4px;
}

.package {
  color: #141419;
  font-weight: 400;
}

.fix-status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-filters {
  margin-bottom: 0;
}

.filter-row {
  display: flex;
  gap: 24px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 100px;
}

.filter-item label {
  font-weight: 400;
  color: var(--disabled-text);
  font-size: 14px;
}

.filter-input-wrapper {
  display: flex;
  align-items: center;
  border: solid var(--border-width) var(--input-border);
  border-radius: 6px;
  padding: 0 12px;
  background: var(--input-bg);
}

.filter-input {
  flex: 1;
  padding: 10px 0;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
  line-height: 19px;
  color: var(--body-text);
}

.score-range-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-input {
  flex: 1;
  min-width: 60px;
  text-align: center;
}

.score-input::placeholder {
  color: #BEC1D2;
}

.score-separator {
  color: var(--disabled-text);
  font-weight: 500;
  font-size: 14px;
}

.score-filter-icon {
  color: #6C6C76;
  margin-left: 8px;
  font-size: 16px;
}

.filter-input:focus {
  outline: none;
}

.filter-input-wrapper:focus-within {
  border-color: var(--outline);
  box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.1);
}

.filter-select {
  padding: 10px 14px;
  border: 1px solid #DCDEE7;
  border-radius: 6px;
  font-size: 14px;
  background: #FFF;
  outline: none;
}

.filter-select:focus {
  border-color: #007cba;
  box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.1);
}

.filter-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #DCDEE7;
}

/* Download Dropdown Styles */
.header-actions {
  margin-left: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dropdown-container {
  position: relative;
  display: flex;
}

.dropdown-main {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.dropdown-toggle {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  padding: 8px 12px;
  min-width: auto;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  margin-top: 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  color: #141419;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item:first-child {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.dropdown-item:last-child {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

/* Overflow handling for long content */
.info-item .value {
  word-break: break-all;
  overflow-wrap: break-word;
  max-width: 100%;
  display: block;
}
</style>
