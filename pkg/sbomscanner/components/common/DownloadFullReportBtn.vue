<template>
  <!-- Download Full Report Dropdown -->
  <div class="dropdown-container">
    <button
      class="btn role-primary dropdown-main"
      aria-label="Download full report"
      type="button"
      @click="downloadFullReport"
      @focusout="handleClickOutside"
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
      <i :class="`icon ${ showDownloadDropdown ? 'icon-chevron-up' : 'icon-chevron-down' }`"></i>
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
</template>

<script>
import { downloadCSV, downloadJSON } from '@sbomscanner/utils/report';
import day from 'dayjs';
export default {
  name:  'DownloadFullReportBtn',
  props: {
    vulnerabilityDetails: {
      type:    Array,
      default: () => {
        return [];
      },
    },
    vulnerabilityReport: {
      type:    Object,
      default: null,
    },
    imageName: {
      type:    String,
      default: '',
    },
  },
  data() {
    return { showDownloadDropdown: false };
  },
  mounted() {
    document.addEventListener('mousedown', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  },
  methods: {
    downloadFullReport() {
      try {
        if (!this.vulnerabilityDetails) {
          this.$store.dispatch('growl/error', {
            title:   'Error',
            message: 'No vulnerability report available for download'
          }, { root: true });

          return;
        }

        // Generate CSV from vulnerability report data
        const csvData = this.generateCSVFromVulnerabilityReport(this.vulnerabilityDetails);

        downloadCSV(csvData, `${ this.imageName }-image-detail-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`);

        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Full report downloaded successfully'
        }, { root: true });
        this.closeDownloadDropdown();
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: `Failed to download full report: ${ error.message }`
        }, { root: true });
      }
    },
    generateCSVFromVulnerabilityReport(vulnerabilityDetails) {
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

      vulnerabilityDetails.forEach((vuln) => {
        const row = [
          `"${ vuln.cveId || '' }"`,
          `"${ vuln.score || '' }"`,
          `"${ vuln.package || '' }"`,
          `"${ vuln.fixVersion || '' }"`,
          `"${ vuln.severity || '' }"`,
          `"${ vuln.exploitability || '' }"`,
          `"${ vuln.installedVersion || '' }"`,
          `"${ vuln.packagePath || '' }"`,
          `"${ (vuln.description || '').replace(/"/g, "'").replace(/[\r\n]+/g, ' ') }"`,
        ];

        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
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

        downloadJSON(reportData, `${ this.imageName }-vulnerability-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.json`);

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
  }
};
</script>

<style lang="scss" scoped>
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
</style>
