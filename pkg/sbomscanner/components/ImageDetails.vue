<template>
  <div class="page">
    <!-- Header Section -->
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
        <button
          class="btn role-secondary"
          aria-label="Download SBOM"
          type="button"
          @click="downloadSBOM"
        >
          <i class="icon icon-download"></i>&nbsp;
          {{ t('imageScanner.images.downloadSBOM') }}
        </button>

        <!-- Download Full Report Dropdown -->
        <div class="dropdown-container">
          <button
            class="btn role-primary dropdown-main"
            aria-label="Download full report"
            type="button"
            @click="downloadFullReport"
          >
            <i class="icon icon-download"></i>&nbsp;
            {{ t('imageScanner.images.downloadReport') }}
          </button>
          <button
            class="btn role-primary dropdown-toggle"
            aria-label="Download options"
            type="button"
            @click="toggleDownloadDropdown"
          >
            <i class="icon icon-chevron-down"></i>
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="showDownloadDropdown"
            class="dropdown-menu"
          >
            <button
              class="dropdown-item"
              @click="downloadFullReport"
            >
              <i class="icon icon-download"></i>
              {{ t('imageScanner.images.downloadImageDetailReport') }}
            </button>
            <button
              class="dropdown-item"
              @click="downloadVulnerabilityReport"
            >
              <i class="icon icon-download"></i>
              {{ t('imageScanner.images.downloadVulnerabilityReport') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Information Section -->
    <div class="image-info-section">
      <div class="info-grid">
        <div class="info-item">
          <span class="label">{{ t('imageScanner.imageDetails.vulnerabilities') }}:</span>
          <span class="value">{{ (totalVulnerabilities || 0).toLocaleString() }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ t('imageScanner.imageDetails.repository') }}:</span>
          <span class="value">{{ imageDetails.repository }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ t('imageScanner.imageDetails.registry') }}:</span>
          <span class="value">{{ imageDetails.registry }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ t('imageScanner.imageDetails.architecture') }}:</span>
          <span class="value">{{ imageDetails.architecture }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ t('imageScanner.imageDetails.operatingSystem') }}:</span>
          <span class="value">{{ imageDetails.operatingSystem }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ t('imageScanner.imageDetails.created') }}:</span>
          <span class="value">{{ imageDetails.created }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ t('imageScanner.imageDetails.imageId') }}:</span>
          <span class="value">{{ imageDetails.imageId?.split(':')[1] || 'Unknown' }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ t('imageScanner.imageDetails.layers') }}:</span>
          <span class="value">{{ imageDetails.layers?.length || '0' }}</span>
        </div>
      </div>
    </div>

    <!-- Summary Section -->
    <div class="summary-section">
      <!-- Most Severe Vulnerabilities Section -->
      <div class="vulnerabilities-section">
        <div class="summary-title">
          {{ t('imageScanner.imageDetails.mostSevereVulnerabilities.title') }}
          <i
            v-clean-tooltip="t('imageScanner.imageDetails.mostSevereVulnerabilities.tooltip')"
            class="icon icon-question-mark"
          ></i>
        </div>
        <div class="vulnerabilities-list">
          <div
            v-for="vuln in mostSevereVulnerabilities"
            :key="vuln.cveId"
            class="row"
          >
            <div class="col span-4">
              <RouterLink :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${PAGE.VULNERABILITIES}/${vuln.cveId}`">
                {{ vuln.cveId }}
              </RouterLink>
            </div>
            <div class="col span-3">
              <ScoreBadge
                v-if="vuln.score && vuln.score.trim()"
                :score="parseFloat(vuln.score.split(' ')[0]) || 0"
                :score-type="vuln.score.split(' ')[1] ? vuln.score.split(' ')[1].replace(/[()]/g, '') : 'CVSS'"
                :severity="vuln.severity"
              />
              <span
                v-else
                class="na-badge"
              >n/a</span>
            </div>
            <div class="col span-4">
              {{ vuln.package }}
            </div>
            <div class="col span-1">
              <i
                :class="vuln.fixAvailable ? 'icon icon-confirmation-alt' : 'icon icon-notify-error'"
                :style="{
                  color: vuln.fixAvailable ? '#007cba' : '#E2E3EB',
                  fontSize: '1.5rem'
                }"
              ></i>
            </div>
          </div>
        </div>
      </div>

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
          <label>{{ t('imageScanner.imageDetails.searchByName') }}</label>
          <div class="filter-input-wrapper">
            <input
              v-model="filters.packageSearch"
              type="text"
              :placeholder="t('imageScanner.imageDetails.searchByNamePlaceholder')"
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
    <SortableTable
      v-if="safeTableData && safeTableData.length > 0"
      :key="`table-${isGrouped ? 'grouped' : 'ungrouped'}`"
      :rows="isGrouped ? layerData : safeTableData"
      :headers="isGrouped ? LAYER_BASED_TABLE : VULNERABILITY_DETAILS_TABLE"
      :has-advanced-filtering="false"
      :namespaced="false"
      :row-actions="false"
      :search="false"
      :paging="true"
      :key-field="'id'"
      :sub-expandable="isGrouped"
      :sub-rows="isGrouped"
      :sub-expand-column="isGrouped"
      @selection="onSelectionChange"
    >
      <template #header-left>
        <div class="table-header-actions">
          <button
            class="btn role-primary"
            :disabled="selectedVulnerabilityCount === 0"
            @click="downloadCustomReport"
          >
            <i class="icon icon-download"></i>&nbsp;
            {{ t('imageScanner.images.buttons.downloadCustomReport') }}
          </button>
          <span
            v-if="selectedVulnerabilityCount > 0"
            class="selected-count"
          >
            {{ selectedVulnerabilityCount }} vulnerabilities selected
          </span>
        </div>
      </template>
      <template #header-right>
        <Checkbox
          v-model:value="isGrouped"
          style="margin: auto 0;"
          label-key="imageScanner.imageDetails.groupByLayer"
        />
      </template>
      <template
        v-if="isGrouped"
        #sub-row="{ row, fullColspan }"
      >
        <tr class="sub-row">
          <td :colspan="fullColspan">
            <SortableTable
              class="sub-table"
              :rows="(row.vulnerabilityList || []).filter(vuln => vuln && typeof vuln === 'object' && vuln.id)"
              :headers="VULNERABILITY_DETAILS_TABLE"
              :search="false"
              :row-actions="false"
              :table-actions="false"
              :key-field="'id'"
            />
          </td>
        </tr>
      </template>
      <template #search>
        <!-- Disable search -->
      </template>
    </SortableTable>
    <div
      v-else
      class="no-data-message"
    >
      <p>No vulnerability data available</p>
    </div>
  </div>
</template>

<script>
import SortableTable from '@shell/components/SortableTable';
import { BadgeState } from '@components/BadgeState';
import { Checkbox } from '@components/Form/Checkbox';
import ScoreBadge from '@pkg/components/common/ScoreBadge';
import { VULNERABILITY_DETAILS_TABLE, LAYER_BASED_TABLE } from '@pkg/config/table-headers';
import { PRODUCT_NAME, RESOURCE, PAGE } from '@pkg/types';
import day from 'dayjs';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import DistributionChart from './DistributionChart.vue';

export default {
  name:       'ImageDetails',
  components: {
    SortableTable,
    BadgeState,
    Checkbox,
    ScoreBadge,
    DistributionChart,
    LabeledSelect,
  },
  data() {
    return {
      imageName:                     '',
      selectedVulnerabilities:       [],
      // Store the loaded resources directly
      loadedVulnerabilityReport:     null,
      loadedSbom:                    null,
      // Cache filtered results to prevent selection issues
      cachedFilteredVulnerabilities: [],
      layerData:                     [],
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
        { label: this.t('imageScanner.enum.cve.none'), value: 'none' },
      ],
      filterExploitabilityOptions: [
        { label: this.t('imageScanner.imageDetails.any'), value: 'any' },
        { label: this.t('imageScanner.imageDetails.affected'), value: 'affected' },
        { label: this.t('imageScanner.imageDetails.suppressed'), value: 'suppressed' },
      ],
      isGrouped: false,
      VULNERABILITY_DETAILS_TABLE,
      LAYER_BASED_TABLE,
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

      const metadata = this.currentImage.imageMetadata;

      if (metadata?.registryURI && metadata?.repository && metadata?.tag) {
        return `${ metadata.registryURI }/${ metadata.repository }:${ metadata.tag }`;
      }

      // Fallback to the hash ID if metadata is not available
      return this.imageName;
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
      if (!this.currentImage) return {};

      return {
        repository:      this.currentImage.imageMetadata?.repository || this.t('imageScanner.general.unknown'),
        registry:        this.currentImage.imageMetadata?.registry || this.t('imageScanner.general.unknown'),
        architecture:    this.currentImage.imageMetadata?.platform.split('/')[0] || this.t('imageScanner.general.unknown'),
        operatingSystem: this.currentImage.imageMetadata?.platform.split('/')[1] || this.t('imageScanner.general.unknown'),
        size:            this.currentImage.imageMetadata?.size || this.t('imageScanner.general.unknown'),
        author:          this.currentImage.imageMetadata?.author || this.t('imageScanner.general.unknown'),
        dockerVersion:   this.currentImage.imageMetadata?.dockerVersion || this.t('imageScanner.general.unknown'),
        created:         this.currentImage.metadata ? `${ day(new Date(this.currentImage.metadata?.creationTimestamp).getTime()).format('MMM D, YYYY') } ${ day(new Date(this.currentImage.metadata?.creationTimestamp).getTime()).format('h:mm a') }` : this.t('imageScanner.general.unknown'),
        imageId:         this.currentImage.imageMetadata?.digest || this.t('imageScanner.general.unknown'),
        layers:          this.currentImage.layers || this.currentImage.spec?.layers || this.t('imageScanner.general.unknown'),
        tag:             this.currentImage.imageMetadata?.tag || this.t('imageScanner.general.unknown'),
        registryURI:     this.currentImage.imageMetadata?.registryURI || this.t('imageScanner.general.unknown')
      };
    },

    // Get severity distribution from vulnerability report
    severityDistribution() {
      if (!this.vulnerabilityReport) {
        return {
          critical: 0, high: 0, medium: 0, low: 0, none: 0
        };
      }

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

      // Calculate distribution from vulnerabilities
      const distribution = {
        critical: 0, high: 0, medium: 0, low: 0, none: 0
      };

      vulnerabilities.forEach((vuln) => {
        const severity = vuln.severity?.toLowerCase();

        if (Object.prototype.hasOwnProperty.call(distribution, severity)) {
          distribution[severity]++;
        } else {
          distribution.none++;
        }
      });

      return distribution;
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

      if (!Array.isArray(vulnerabilities)) {
        return [];
      }

      // Transform the vulnerability data to match the expected format
      return vulnerabilities.map((vuln, index) => ({
        id:               `${ vuln.cve }-${ vuln.packageName }-${ index }`, // Create unique ID
        cveId:            vuln.cve,
        score:            vuln.cvss?.nvd?.v3score ? `${ vuln.cvss.nvd.v3score } (CVSS v3)` : vuln.cvss?.redhat?.v3score ? `${ vuln.cvss.redhat.v3score } (CVSS v3)` : vuln.cvss?.ghsa?.v3score ? `${ vuln.cvss.ghsa.v3score } (CVSS v3)` : '',
        package:          vuln.packageName,
        packageVersion:   vuln.installedVersion,
        packagePath:      vuln.purl || vuln.diffID, // Use purl if available, fallback to diffID
        fixAvailable:     vuln.fixedVersions && vuln.fixedVersions.length > 0,
        fixVersion:       vuln.fixedVersions ? vuln.fixedVersions.join(', ') : '',
        severity:         vuln.severity?.toLowerCase() || this.t('imageScanner.general.unknown'),
        exploitability:   vuln.suppressed ? 'Suppressed' : 'Affected',
        description:      vuln.description,
        title:            vuln.title,
        references:       vuln.references || [],
        // Add diffID for layer grouping
        diffID:           vuln.diffID,
        installedVersion: vuln.installedVersion
      }));
    },

    // Get most severe vulnerabilities
    mostSevereVulnerabilities() {
      if (!this.vulnerabilityReport) return [];

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

      // Sort by severity (critical > high > medium > low > none) and then by score
      const severityOrder = {
        critical: 5, high: 4, medium: 3, low: 2, none: 1
      };

      const sortedVulnerabilities = vulnerabilities
        .sort((a, b) => {
          const severityDiff = (severityOrder[b.severity?.toLowerCase()] || 0) - (severityOrder[a.severity?.toLowerCase()] || 0);

          if (severityDiff !== 0) return severityDiff;

          // If same severity, sort by score (higher score first)
          const scoreA = parseFloat(a.cvss?.nvd?.v3score) || 0;
          const scoreB = parseFloat(b.cvss?.nvd?.v3score) || 0;

          return scoreB - scoreA;
        })
        .slice(0, 5);

      // Transform to match the expected format for the UI
      return sortedVulnerabilities.map((vuln, index) => ({
        cveId:        vuln.cve,
        score:        vuln.cvss?.nvd?.v3score ? `${ vuln.cvss.nvd.v3score } (CVSS v3)` : vuln.cvss?.redhat?.v3score ? `${ vuln.cvss.redhat.v3score } (CVSS v3)` : vuln.cvss?.ghsa?.v3score ? `${ vuln.cvss.ghsa.v3score } (CVSS v3)` : '',
        severity:     vuln.severity?.toLowerCase() || null,
        package:      vuln.packageName,
        fixAvailable: vuln.fixedVersions && vuln.fixedVersions.length > 0
      }));
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

    severityDistributionWithPercentages() {
      const total = this.totalVulnerabilities;
      const distribution = {};

      Object.keys(this.severityDistribution).forEach((severity) => {
        const count = this.severityDistribution[severity];

        distribution[severity] = {
          count,
          percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
        };
      });

      return distribution;
    },

    filteredVulnerabilities() {
      // Return cached results to prevent selection issues
      return this.cachedFilteredVulnerabilities;
    },

    // Safe data for SortableTable
    safeTableData() {
      if (this.isGrouped) {
        this.layerData = this.vulnerabilitiesByLayer(this.cachedFilteredVulnerabilities) || [];
        const layerData = this.vulnerabilitiesByLayer(this.cachedFilteredVulnerabilities) || [];

        return layerData.filter((item) => item && typeof item === 'object' && item.id);
      } else {
        const vulnData = this.filteredVulnerabilities || [];

        return vulnData.filter((item) => item && typeof item === 'object' && item.id);
      }
    },

    // Get the count of selected vulnerabilities for display
    selectedVulnerabilityCount() {
      return this.selectedVulnerabilities ? this.selectedVulnerabilities.length : 0;
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
    // Watch for isGrouped changes
    isGrouped(newVal, oldVal) {
      // Clear selections when switching modes
      if (newVal !== oldVal) {
        this.selectedVulnerabilities = [];
      }
    }
  },

  methods: {
    // Decode layer ID to show meaningful layer information
    decodeLayerId(layerId) {
      if (!layerId || layerId === this.t('imageScanner.general.unknown')) {
        return 'Unknown Layer';
      }

      // If it's a SHA256 hash, try to decode it or show a truncated version
      if (layerId.startsWith('sha256:')) {
        const hash = layerId.substring(7); // Remove 'sha256:' prefix
        const shortHash = hash.substring(0, 12); // Show first 12 characters

        // Try to get layer information from image data
        if (this.currentImage && this.currentImage.layers) {
          // Look for layer information in the image data
          const layers = this.currentImage.layers;

          if (Array.isArray(layers)) {
            const layerInfo = layers.find((layer) => layer.diffID === layerId ||
              layer.digest === layerId ||
              (layer.command && layer.command.includes(hash.substring(0, 8)))
            );

            if (layerInfo && layerInfo.command) {
              // Return the decoded command
              return this.decodeBase64(layerInfo.command) || layerInfo.command;
            }
          }
        }

        // Fallback: show truncated hash with layer number
        return `Layer ${ shortHash }...`;
      }

      // If it's a package path (purl), extract meaningful info
      if (layerId.includes('pkg:')) {
        const parts = layerId.split('@');

        if (parts.length > 1) {
          const packageInfo = parts[0].split('/').pop();
          const version = parts[1].split('?')[0];

          return `${ packageInfo }@${ version }`;
        }
      }

      // Default fallback
      return layerId.length > 50 ? `${ layerId.substring(0, 50) }...` : layerId;
    },

    // Format vulnerability counts for display (returns object for IdentifiedCVEsCell)
    formatVulnerabilityCounts(severityCounts) {
      if (!severityCounts) {
        return {
          critical: 0, high: 0, medium: 0, low: 0, none: 0
        };
      }

      return {
        critical: severityCounts.critical || 0,
        high:     severityCounts.high || 0,
        medium:   severityCounts.medium || 0,
        low:      severityCounts.low || 0,
        unknown:     severityCounts.none || 0
      };
    },

    // Get layer updated time
    getLayerUpdatedTime(layerId) {
      // Try to get from image metadata
      if (this.currentImage && this.currentImage.metadata) {
        return `${ day(new Date(this.currentImage.metadata?.creationTimestamp).getTime()).format('MMM D, YYYY') } ${ day(new Date(this.currentImage.metadata?.creationTimestamp).getTime()).format('h:mm a') }` || this.t('imageScanner.general.unknown');
      }

      return this.t('imageScanner.general.unknown');
    },

    // Get layer size
    getLayerSize(layerId) {
      // Since individual layer sizes aren't available in the current data structure,
      // we'll show a placeholder or calculate an estimated size

      // Try to get from image layers data first
      if (this.currentImage && this.currentImage.layers) {
        const layers = this.currentImage.layers;

        if (Array.isArray(layers)) {
          const layerInfo = layers.find((layer) => layer.diffID === layerId ||
            layer.digest === layerId ||
            (layer.diffID && layer.diffID.includes(layerId.substring(0, 12)))
          );

          if (layerInfo && layerInfo.size) {
            // Convert bytes to MB if needed
            if (typeof layerInfo.size === 'number') {
              return `${ (layerInfo.size / 1024 / 1024).toFixed(2) } MB`;
            }

            return layerInfo.size;
          }
        }
      }

      // Calculate estimated size based on total image size and number of layers
      if (this.currentImage && this.currentImage.imageMetadata) {
        const totalSize = this.currentImage.imageMetadata.size;

        if (totalSize && totalSize !== this.t('imageScanner.general.unknown')) {
          // Get total number of layers
          const totalLayers = this.vulnerabilitiesByLayer?.length || 1;

          if (typeof totalSize === 'number') {
            const estimatedSize = totalSize / totalLayers;

            return `${ (estimatedSize / 1024 / 1024).toFixed(2) } MB`;
          }
        }
      }

      // Return placeholder since individual layer sizes aren't available
      return 'N/A';
    },

    // Download dropdown methods
    toggleDownloadDropdown() {
      this.showDownloadDropdown = !this.showDownloadDropdown;
    },

    closeDownloadDropdown() {
      this.showDownloadDropdown = false;
    },

    handleClickOutside(event) {
      // Close dropdown if clicking outside
      if (this.showDownloadDropdown && !event.target.closest('.dropdown-container')) {
        this.closeDownloadDropdown();
      }
    },

    // Utility method to decode base64 strings
    decodeBase64(str) {
      try {
        return atob(str);
      } catch (error) {
        return str; // Return original string if decoding fails
      }
    },

    // Download methods
    downloadSBOM() {
      try {
        if (!this.sbom) {
          this.$store.dispatch('growl/error', {
            title:   'Error',
            message: 'No SBOM data available for download'
          }, { root: true });

          return;
        }

        // Generate SBOM download
        const sbomData = JSON.stringify(this.sbom.spdx, null, 2);

        this.downloadJSON(sbomData, `${ this.imageName }-sbom_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.spdx.json`);

        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'SBOM downloaded successfully'
        }, { root: true });

        this.closeDownloadDropdown();
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download SBOM'
        }, { root: true });
      }
    },

    downloadImageDetailReport() {
      try {
        if (!this.vulnerabilityReport || !this.sbom) {
          this.$store.dispatch('growl/error', {
            title:   'Error',
            message: 'No vulnerability report or SBOM data available for download'
          }, { root: true });

          return;
        }

        // Generate CSV from vulnerability report data
        const csvData = this.generateCSVFromVulnerabilityReport();

        this.downloadCSV(csvData, `${ this.imageName }-image-detail-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`);

        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Image detail report downloaded successfully'
        }, { root: true });

        this.closeDownloadDropdown();
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download image detail report'
        }, { root: true });
      }
    },

    downloadVulnerabilityReport() {
      try {
        if (!this.vulnerabilityReport) {
          this.$store.dispatch('growl/error', {
            title:   'Error',
            message: 'No vulnerability report data available for download'
          }, { root: true });

          return;
        }

        // Generate JSON vulnerability report
        const reportData = JSON.stringify(this.vulnerabilityReport.report, null, 2);

        this.downloadJSON(reportData, `${ this.imageName }-vulnerability-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.json`);

        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Vulnerability report downloaded successfully'
        }, { root: true });

        this.closeDownloadDropdown();
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download vulnerability report'
        }, { root: true });
      }
    },

    filterBySeverity(severity) {
      this.filters.severity = severity;
    },

    updateFilteredVulnerabilities() {
      // Defensive check to prevent errors
      if (!this.vulnerabilityDetails || !Array.isArray(this.vulnerabilityDetails)) {
        this.cachedFilteredVulnerabilities = [];

        return;
      }

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
        filtered = filtered.filter((v) => v.exploitability === this.filters.exploitability);
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

        // Approach 2: If not found, try direct API call
        if (!foundImage) {
          try {
            await this.$store.dispatch('cluster/find', {
              type: RESOURCE.IMAGE,
              id:   this.imageName,
              opt:  { force: true, namespace: 'sbomscanner' }
            });
          } catch (error) {
            // Ignore error if image not found
          }
        }

        // Load associated vulnerability report if it exists
        if (this.currentImage?.vulnerabilityReport) {
          await this.$store.dispatch('cluster/find', {
            type: RESOURCE.VULNERABILITY_REPORT,
            id:   this.currentImage.vulnerabilityReport.metadata.name,
            opt:  { force: true, namespace: 'sbomscanner' }
          });
        }

        // Load associated SBOM if it exists
        if (this.currentImage?.sbom) {
          await this.$store.dispatch('cluster/find', {
            type: RESOURCE.SBOM,
            id:   this.currentImage.sbom.metadata.name,
            opt:  { force: true, namespace: 'sbomscanner' }
          });
        }
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: `Failed to load image data: ${ error.message }`
        }, { root: true });
      }
    },

    getSeverityBarColor(severity) {
      const colors = {
        critical: '#850917',
        high:     '#DE2136',
        medium:   '#FF8533',
        low:      '#FDD835',
        none:     '#E0E0E0'
      };

      return colors[severity] || colors.none;
    },

    async onSelectionChange(selected) {
      // Handle selection changes for both grouped and ungrouped modes
      try {
        await this.$nextTick();
        if (this.isGrouped) {
          // When grouped, selected items are layer objects
          // We need to extract all vulnerabilities from selected layers
          const allVulnerabilities = [];

          if (Array.isArray(selected)) {
            selected.forEach((layer) => {
              if (layer && layer.vulnerabilityList && Array.isArray(layer.vulnerabilityList)) {
                allVulnerabilities.push(...layer.vulnerabilityList);
              }
            });
          }
          this.selectedVulnerabilities = allVulnerabilities;
        } else {
          // When not grouped, selected items are individual vulnerabilities
          this.selectedVulnerabilities = Array.isArray(selected) ? selected : [];
        }
      } catch (error) {
        this.selectedVulnerabilities = [];
      }
    },

    async onSubTableSelectionChange(selected) {
      // Handle selection from sub-tables (individual vulnerabilities within layers)
      try {
        await this.$nextTick();

        if (this.isGrouped) {
          // When grouped, we need to merge sub-table selections with layer selections
          // For now, we'll replace the selection with sub-table selections
          // This allows selecting individual vulnerabilities within layers
          this.selectedVulnerabilities = Array.isArray(selected) ? selected : [];
        }
      } catch (error) {
        this.selectedVulnerabilities = [];
      }
    },

    downloadFullReport() {
      try {
        if (!this.vulnerabilityReport || !this.sbom) {
          this.$store.dispatch('growl/error', {
            title:   'Error',
            message: 'No vulnerability report or SBOM data available for download'
          }, { root: true });

          return;
        }

        // Generate CSV from vulnerability report data
        const csvData = this.generateCSVFromVulnerabilityReport();

        this.downloadCSV(csvData, `${ this.imageName }-image-detail-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`);

        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Full report downloaded successfully'
        }, { root: true });
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: `Failed to download full report: ${ error.message }`
        }, { root: true });
      }
    },

    downloadCustomReport() {
      try {
        if (!this.vulnerabilityReport) {
          this.$store.dispatch('growl/error', {
            title:   'Error',
            message: 'No vulnerability report data available for download'
          }, { root: true });

          return;
        }

        // Generate CSV from filtered vulnerability data
        const csvData = this.generateCSVFromFilteredVulnerabilities();

        this.downloadCSV(csvData, `${ this.imageName }-image-detail-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`);

        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Custom report downloaded successfully'
        }, { root: true });
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: `Failed to download custom report: ${ error.message }`
        }, { root: true });
      }
    },

    generateCSVFromVulnerabilityReport() {
      const vulnerabilities = this.vulnerabilityDetails;
      const headers = [
        'CVE_ID',
        'SCORE',
        'PACKAGE',
        'FIX AVAILABLE',
        'SEVERITY',
        'EXPLOITABILITY',
        'PACKAGE VERSION',
        'PACKAGE PATH',
        'DESCRIPTION',
      ];

      const csvRows = [headers.join(',')];

      vulnerabilities.forEach((vuln) => {
        const row = [
          `"${ vuln.cveId || '' }"`,
          `"${ vuln.score || '' }"`,
          `"${ vuln.package || '' }"`,
          `"${ vuln.fixVersion }"`,
          `"${ vuln.severity || '' }"`,
          `"${ vuln.exploitability || '' }"`,
          `"${ vuln.installedVersion || '' }"`,
          `"${ vuln.packagePath || '' }"`,
          `"${ vuln.description.replace(/\"/g, "'").replace(/[\r\n]+/g, ' ') }"`,
        ];

        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    },

    generateCSVFromFilteredVulnerabilities() {
      // Use selected vulnerabilities if any are selected, otherwise use all filtered vulnerabilities
      const vulnerabilities = this.selectedVulnerabilities && this.selectedVulnerabilities.length > 0 ? this.selectedVulnerabilities : this.filteredVulnerabilities;

      const headers = [
        'CVE_ID',
        'SCORE',
        'PACKAGE',
        'FIX AVAILABLE',
        'SEVERITY',
        'EXPLOITABILITY',
        'PACKAGE VERSION',
        'PACKAGE PATH',
        'DESCRIPTION',
      ];

      const csvRows = [headers.join(',')];

      vulnerabilities.forEach((vuln) => {
        const row = [
          `"${ vuln.cveId || '' }"`,
          `"${ vuln.score || '' }"`,
          `"${ vuln.package || '' }"`,
          `"${ vuln.fixVersion }"`,
          `"${ vuln.severity || '' }"`,
          `"${ vuln.exploitability || '' }"`,
          `"${ vuln.installedVersion || '' }"`,
          `"${ vuln.packagePath || '' }"`,
          `"${ vuln.description.replace(/\"/g, "'").replace(/[\r\n]+/g, ' ') }"`,
        ];

        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    },

    downloadCSV(csvContent, filename) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },

    downloadJSON(jsonContent, filename) {
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },

    // Group vulnerabilities by layer (diffID) - following ImageOverview pattern
    vulnerabilitiesByLayer(vulnerabilityReport) {
      try {
        // Group vulnerabilities by diffID (layer identifier)
        const layerMap = new Map();

        vulnerabilityReport.forEach((vuln) => {
          if (!vuln || typeof vuln !== 'object') {
            return; // Skip invalid vulnerabilities
          }

          const layerId = vuln.diffID || vuln.packagePath || this.t('imageScanner.general.unknown');
          const mapKey = layerId;

          if (layerMap.has(mapKey)) {
            const layer = layerMap.get(mapKey);

            if (layer && layer.vulnerabilities && Array.isArray(layer.vulnerabilities)) {
              layer.vulnerabilities.push(vuln);
              // Count severity
              const severity = vuln.severity?.toLowerCase() || 'none';

              if (layer.severityCounts && layer.severityCounts[severity] !== undefined) {
                layer.severityCounts[severity]++;
              }
            }
          } else {
            const severityCounts = {
              critical: 0, high: 0, medium: 0, low: 0, none: 0
            };
            const severity = vuln.severity?.toLowerCase() || 'none';

            if (severityCounts[severity] !== undefined) {
              severityCounts[severity]++;
            }

            layerMap.set(mapKey, {
              id:                mapKey,
              layerId:           this.decodeLayerId(layerId), // Decode layer ID to show meaningful information
              vulnerabilities:   this.formatVulnerabilityCounts(severityCounts),
              updated:           this.getLayerUpdatedTime(layerId),
              size:              this.getLayerSize(layerId),
              severityCounts,
              vulnerabilityList: [vuln]
            });
          }
        });

        // Create severity breakdown and sort
        const result = Array.from(layerMap.values()).map((layer) => {
          if (!layer || !layer.severityCounts || !layer.vulnerabilityList || !Array.isArray(layer.vulnerabilityList)) {
            return null;
          }

          const counts = layer.severityCounts;

          layer.vulnerabilities = this.formatVulnerabilityCounts(counts);
          layer.updated = this.getLayerUpdatedTime(layer.id);
          layer.size = this.getLayerSize(layer.id);

          return layer;
        }).filter((layer) => layer !== null && layer !== undefined).sort((a, b) => {
          if (!a || !b) return 0;

          return (b.vulnerabilityList?.length || 0) - (a.vulnerabilityList?.length || 0);
        });

        return result;
      } catch (error) {
        return [];
      }
    },
  },
};
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  padding: 24px;
  min-height: 100%;
  gap: 24px;
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
      background: #850917;
      color: white !important;
    }

    &.high {
      background: #DE2136;
      color: white !important;
    }

    &.medium {
      background: #FF8533;
      color: white !important;
    }

    &.low {
      background: #EEC707;
      color: white !important;
    }

    &.na{
      background: #DCDEE7;
      color: #717179 !important;
    }

    &.none{
      background: #DCDEE7;
      color: #717179 !important;
    }
}

.image-info-section {
  padding: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px 32px;
}

.info-item {
  display: flex;
  justify-content: flex-start;
  gap: 16px;
  margin-bottom: 8px;
}

.label {
  font-weight: 400;
  font-size: 14px;
  color: var(--disabled-text);
}

.value {
  font-weight: 400;
  font-size: 14px;
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

.vulnerabilities-section,
.severity-section {
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.vulnerabilities-section {
  border-right: solid var(--border-width) var(--input-border);
}

.summary-title {
  font-family: Lato;
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 21px;
  margin-bottom: 8px;
}

.vulnerabilities-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.vulnerabilities-list .row {
  width: 100%;
  margin: 0;
}

.vulnerabilities-list .col {
  padding: 0 16px;
  min-height: 24px;
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

.selected-count {
  font-weight: 400;
}

.table-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-top-left {
  display: flex;
  align-items: center;
  gap: 16px;
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

.dropdown-item .icon {
  font-size: 14px;
  color: #6c6c76;
}

/* Overflow handling for long content */
.info-item .value {
  word-break: break-all;
  overflow-wrap: break-word;
  max-width: 100%;
  display: block;
}

/* Group by layer control styling */
.group-by-layer-control {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 10;
}

.group-by-layer-control label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  padding: 4px;
}

.group-by-layer-control input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
  pointer-events: auto;
}

.na-badge {
  display: inline-block;
  background-color: #F4F5FA;
  color: #6C6C76;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  width: 100%;
  height: 24px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
