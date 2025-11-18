<template>
  <div class="page">
    <div class="header-section mb-20">
      <div class="title">
        {{ t("imageScanner.images.title") }}
      </div>
      <!-- <div class="filter-dropdown">
        <LabeledSelect
          v-model:value="selectedCveFilter"
          :options="filterCveOptions"
          :close-on-select="true"
          :multiple="false"
          disabled
          @selecting="changeCveFilter"
        />
      </div>
      <div class="filter-dropdown">
        <LabeledSelect
          v-model:value="selectedImageFilter"
          :options="filterImageOptions"
          :close-on-select="true"
          :multiple="false"
          disabled
          @selecting="changeImageFilter"
        />
      </div> -->
      <div>
        <button
          mat-button
          class="btn role-primary"
          aria-label="Download full report"
          type="button"
          :disabled="!rows || rows.length === 0"
          @click="downloadCSVReport(rows, false)"
        >
          <i class="icon icon-download"></i>
          {{ t('imageScanner.images.downloadReport') }}
        </button>
      </div>
    </div>
    <!-- <div class="summary-section">
      <TopRiskyImagesChart v-if="preprocessedDataset.topRiskyImages" :topRiskyImages="preprocessedDataset.topRiskyImages"/>
      <ImageRiskAssessment v-if="preprocessedDataset.chartData" :chartData="preprocessedDataset.chartData" :filterFn="filterBySeverity"/>
    </div> -->
    <div class="search-filters">
      <div class="filter-row">
        <div class="filter-item">
          <label>{{ t('imageScanner.images.listTable.headers.imageName') }}</label>
          <div class="filter-input-wrapper">
            <input
              v-model="filters.imageSearch"
              type="text"
              :placeholder="t('imageScanner.images.listTable.filters.placeholder.image')"
              class="filter-input"
            />
            <i
              class="icon icon-search"
              style="color: #6C6C76; margin-left: 8px;"
            ></i>
          </div>
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.images.listTable.filters.label.severity') }}</label>
          <LabeledSelect
            v-model:value="filters.severitySearch"
            :options="severityOptions"
            :close-on-select="true"
            :multiple="false"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.images.listTable.filters.label.repository') }}</label>
          <LabeledSelect
            v-model:value="filters.repositorySearch"
            :options="repositoryOptions"
            :close-on-select="true"
            :multiple="false"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.images.listTable.filters.label.registry') }}</label>
          <LabeledSelect
            v-model:value="filters.registrySearch"
            :options="registryOptions"
            :close-on-select="true"
            :multiple="false"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.images.listTable.filters.label.platform') }}</label>
          <div class="filter-input-wrapper">
            <input
              v-model="filters.platformSearch"
              type="text"
              :placeholder="t('imageScanner.images.listTable.filters.placeholder.image')"
              class="filter-input"
            />
            <i
              class="icon icon-search"
              style="color: #6C6C76; margin-left: 8px;"
            ></i>
          </div>
        </div>
      </div>
    </div>
    <SortableTable
      :headers="isGrouped ? REPO_BASED_TABLE : IMAGE_LIST_TABLE"
      :namespaced="false"
      :search="false"
      :paging="true"
      :row-actions="!isGrouped"
      :table-actions="true"
      :sub-expandable="isGrouped"
      :sub-rows="isGrouped"
      :sub-expand-column="isGrouped"
      :rows="isGrouped ? filteredRows.rowsByRepo : filteredRows.rows"
      :loading="$fetchState.pending"
      :key-field="'id'"
      @selection="onSelectionChange"
    >
      <template #header-left>
        <div class="table-top-left">
          <button
            mat-button
            class="btn role-primary"
            aria-label="Download custom report"
            :disabled="!(selectedRows && selectedRows.length)"
            type="button"
            @click="downloadCSVReport(selectedRows, isGrouped)"
          >
            <i class="icon icon-download"></i>
            {{ t('imageScanner.images.buttons.downloadCustomReport') }}
          </button>
        </div>
      </template>
      <template #header-right>
        <Checkbox
          v-model:value="isGrouped"
          style="margin: auto 0;"
          label-key="imageScanner.images.listTable.checkbox.groupByRepo"
        />
      </template>
      <template
        v-if="isGrouped"
        #sub-row="{ row, fullColspan }"
      >
        <tr
          class="sub-row"
        >
          <td :colspan="fullColspan">
            <SortableTable
              class="sub-table"
              :rows="row.images"
              :headers="REPO_BASED_IMAGE_LIST_TABLE"
              :search="false"
              :row-actions="true"
              :table-actions="false"
            >
              <template #row-actions="{ row: subRow }">
                <ActionMenu
                  :resource="subRow"
                  :custom-actions="customActions"
                />
              </template>
            </SortableTable>
          </td>
        </tr>
      </template>
      <template #row-actions="{ row }">
        <ActionMenu
          :resource="row"
          :custom-actions="customActions"
        />
      </template>
    </SortableTable>
  </div>
</template>

<script>
import SortableTable from '@shell/components/SortableTable';
import LabeledSelect from '@shell/components/form/LabeledSelect';
// import TopRiskyImagesChart from '@sbomscanner/components/TopRiskyImagesChart';
// import ImageRiskAssessment from '@sbomscanner/components/ImageRiskAssessment';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { IMAGE_LIST_TABLE, REPO_BASED_TABLE, REPO_BASED_IMAGE_LIST_TABLE } from '@sbomscanner/config/table-headers';
import { Checkbox } from '@components/Form/Checkbox';
import { RESOURCE } from '@sbomscanner/types';
import { imageDetailsToCSV } from '@sbomscanner/utils/report';
import { saveAs } from 'file-saver';
import { constructImageName } from '@sbomscanner/utils/image';
import Papa from 'papaparse';
import _ from 'lodash';
import day from 'dayjs';

export default {
  name:       'ImageOverview',
  components: {
    LabeledSelect,
    // TopRiskyImagesChart,
    // ImageRiskAssessment,
    SortableTable,
    Checkbox,
    ActionMenu
  },
  data() {
    const filterCveOptions = [
      {
        value: 'allCves',
        label: this.t('imageScanner.images.filters.cve.allCves')
      },
      {
        value: 'affectingCvesOnly',
        label: this.t('imageScanner.images.filters.cve.affectingCvesOnly')
      },
    ];
    const filterImageOptions = [
      {
        value: 'allImages',
        label: this.t('imageScanner.images.filters.image.allImages')
      },
      {
        value: 'excludeBaseImages',
        label: this.t('imageScanner.images.filters.image.excludeBaseImages')
      },
      {
        value: 'includeBaseImages',
        label: this.t('imageScanner.images.filters.image.includeBaseImages')
      }
    ];
    const severityOptions = [
      {
        value: 'any',
        label: this.t('imageScanner.imageDetails.any')
      },
      {
        value: 'critical',
        label: this.t('imageScanner.enum.cve.critical')
      },
      {
        value: 'high',
        label: this.t('imageScanner.enum.cve.high')
      },
      {
        value: 'medium',
        label: this.t('imageScanner.enum.cve.medium')
      },
      {
        value: 'low',
        label: this.t('imageScanner.enum.cve.low')
      },
      {
        value: 'unknown',
        label: this.t('imageScanner.enum.cve.unknown')
      },
    ];

    return {
      rows:                [],
      rowsByRepo:          [],
      REPO_BASED_TABLE,
      IMAGE_LIST_TABLE,
      REPO_BASED_IMAGE_LIST_TABLE,
      isGrouped:           false,
      selectedRows:        [],
      filterCveOptions,
      filterImageOptions,
      severityOptions,
      selectedCveFilter:   filterCveOptions[0],
      selectedImageFilter: filterImageOptions[0],
      filters:             {
        imageSearch:      '',
        severitySearch:   severityOptions[0].value,
        repositorySearch: 'Any',
        registrySearch:   'Any',
        platformSearch:   '',
      },
      debouncedFilters: {
        imageSearch:      '',
        severitySearch:   severityOptions[0].value,
        repositorySearch: 'Any',
        registrySearch:   'Any',
        platformSearch:   '',
      },
      registryCrds: [],
    };
  },
  watch: {
    filters: {
      handler: _.debounce(function(newFilters) {
        this.debouncedFilters = { ...newFilters };
      }, 500),
      deep: true,
    },
  },
  computed: {
    filteredRows() {
      const filters = this.debouncedFilters;
      const filteredRows = this.rows.filter((row) => {
        const imageName = constructImageName(row.imageMetadata);
        const imageMatch = !filters.imageSearch || imageName.toLowerCase().includes(filters.imageSearch.toLowerCase());
        const severityMatch = filters.severitySearch === 'any' || row.report.summary[filters.severitySearch] > 0;
        const repositoryMatch = filters.repositorySearch === 'Any' || row.imageMetadata.repository === filters.repositorySearch;
        const registryMatch = filters.registrySearch === 'Any' || `${ row.metadata.namespace }/${ row.imageMetadata.registry }` === filters.registrySearch;
        const platformMatch = !filters.platformSearch || (row.imageMetadata.platform && row.imageMetadata.platform.toLowerCase().includes(filters.platformSearch.toLowerCase()));

        return imageMatch && severityMatch && repositoryMatch && registryMatch && platformMatch;
      });
      const rowsByRepo = this.preprocessData(filteredRows);

      return {
        rows: filteredRows,
        rowsByRepo,
      };
    },
    customActions() {
      const downloadSbom = {
        action:   'downloadSbom',
        label:    this.t('imageScanner.images.buttons.downloadSbom'),
        icon:     'icon-download',
        enabled:  true,
        bulkable: false,
        invoke:   (_, res) => {
          this.downloadSbom(res);
        }
      };
      const downloadCsv = {
        action:   'downloadCsv',
        label:    this.t('imageScanner.images.buttons.downloadCsv'),
        icon:     'icon-download',
        enabled:  true,
        bulkable: false,
        invoke:   (_, res) => {
          this.downloadCsv(res);
        }
      };
      const downloadJson = {
        action:   'downloadJson',
        label:    this.t('imageScanner.images.buttons.downloadJson'),
        icon:     'icon-download',
        enabled:  true,
        bulkable: false,
        invoke:   (_, res) => {
          this.downloadJson(res);
        }
      };

      return [
        downloadSbom,
        { divider: true },
        downloadCsv,
        downloadJson
      ];
    },
    repositoryOptions() {
      const repoSet = new Set();

      this.registryCrds.forEach((reg) => {
        if (reg.spec.repositories && reg.spec.repositories.length) {
          reg.spec.repositories.forEach((repo) => repoSet.add(repo));
        }
      });

      return ['Any', ...repoSet];
    },
    registryOptions() {
      return ['Any', ...this.registryCrds.map((reg) => `${ reg.metadata.namespace }/${ reg.metadata.name }`)];
    }
  },
  async fetch() {
    this.rows = await this.$store.dispatch('cluster/findAll', { type: RESOURCE.VULNERABILITY_REPORT });
    this.rowsByRepo = this.preprocessData(this.rows);
    this.registryCrds = await this.$store.dispatch('cluster/findAll', { type: RESOURCE.REGISTRY });
  },
  methods: {
    async downloadCSVReport(rows, isDataGrouped) {
      try {
        const imagesData = isDataGrouped ? rows.map((row) => row.images).flat() : rows;

        const imageList = imagesData.map((row) => {
          return {
            'IMAGE REFERENCE': isDataGrouped ? constructImageName(row.imageMetadata) : row.imageReference,
            'CVEs(Critical)':  isDataGrouped ? row.scanResult.critical : row.report.summary.critical,
            'CVEs(High)':      isDataGrouped ? row.scanResult.high : row.report.summary.high,
            'CVEs(Medium)':    isDataGrouped ? row.scanResult.medium : row.report.summary.medium,
            'CVEs(Low)':       isDataGrouped ? row.scanResult.low : row.report.summary.low,
            'CVEs(None)':      isDataGrouped ? row.scanResult.unknown : row.report.summary.unknown,
            'IMAGE ID':        row.imageMetadata.digest,
            REGISTRY:          row.imageMetadata.registry,
            REPOSITORY:        row.imageMetadata.repository,
            PLATFORM:          row.imageMetadata.platform,
          };
        });
        const csvBlob = new Blob([Papa.unparse(imageList)], { type: 'text/csv;charset=utf-8' });

        await saveAs(csvBlob, `image-scan-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`);
        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Image scan report downloaded successfully'
        }, { root: true });
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download image scan report'
        }, { root: true });
      }
    },
    async downloadSbom(res) {
      try {
        const target = (res && res.length ? res[0] : null);
        const sbom = await this.$store.dispatch('cluster/find', { type: RESOURCE.SBOM, id: target.id });
        const spdxString = JSON.stringify(sbom.spdx, null, 2);
        const sbomBlob = new Blob([spdxString], { type: 'application/json;charset=utf-8' });

        await saveAs(sbomBlob, `${ sbom.metadata.name }-sbom_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.spdx.json`);
        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'SBOM downloaded successfully'
        }, { root: true });
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download SBOM'
        }, { root: true });
      }
    },
    async downloadJson(res) {
      try {
        const target = (res && res.length ? res[0] : null);
        const vulReport = await this.$store.dispatch('cluster/find', { type: RESOURCE.VULNERABILITY_REPORT, id: target.id });
        const jsonBlob = new Blob([JSON.stringify(vulReport.report, null, 2)], { type: 'application/json;charset=utf-8' });

        await saveAs(jsonBlob, `${ target.id }-vulnerabilities-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.json`);
        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Vulnerability report downloaded successfully'
        }, { root: true });
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download vulnerability report'
        }, { root: true });
      }
    },
    async downloadCsv(res) {
      try {
        const target = (res && res.length ? res[0] : null);
        const vulReport = await this.$store.dispatch('cluster/find', { type: RESOURCE.VULNERABILITY_REPORT, id: target.id });
        let vulnerabilityList = [];

        vulReport.report.results.forEach((result) => {
          vulnerabilityList = vulnerabilityList.concat(result.vulnerabilities);
        });
        const csv = imageDetailsToCSV(
          vulnerabilityList
        );
        const csvBlob = new Blob([Papa.unparse(csv)], { type: 'text/csv;charset=utf-8' });

        await saveAs(csvBlob, `${ target.id }-image-detail-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`);
        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Image detail report downloaded successfully'
        }, { root: true });
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download image detail report'
        }, { root: true });
      }
    },
    // applyFilters() {
    //   let filtered = _.cloneDeep(this.preprocessedImagesBak);

    //   if (this.selectedImageFilter.value === 'excludeBaseImages' || this.selectedImageFilter === 'excludeBaseImages') {
    //     filtered = filtered.filter((image) => !image.spec.isBaseImage);
    //   } else if (this.selectedImageFilter.value === 'includeBaseImages' || this.selectedImageFilter === 'includeBaseImages') {
    //     filtered = filtered.filter((image) => image.spec.isBaseImage);
    //   }
    //   if (this.selectedCveFilter.value === 'affectingCvesOnly' || this.selectedCveFilter === 'affectingCvesOnly') {
    //     filtered = filtered.filter((image) => image.spec.hasAffectedPackages);
    //   }
    //   this.preprocessedDataset = this.preprocessData(filtered);
    // },

    // changeImageFilter(selectedImageFilter) {
    //   this.selectedImageFilter = selectedImageFilter;
    //   this.applyFilters();
    // },

    // changeCveFilter(selectedCveFilter) {
    //   this.selectedCveFilter = selectedCveFilter;
    //   this.applyFilters();
    // },
    // filterBySeverity(severity) {
    //   this.preprocessedDataset.preprocessedImages = _.cloneDeep(this.preprocessedImagesBak);
    //   if (severity) {
    //     this.preprocessedDataset.preprocessedImages = this.preprocessedDataset.preprocessedImages.filter((image) => (image.severity.toLowerCase() === severity.toLowerCase()));
    //   }
    // },
    onSelectionChange(selected) {
      this.selectedRows = selected || [];
    },
    preprocessData(vulReports) {
      const severityKeys = ['critical', 'high', 'medium', 'low', 'unknown'];
      const repoMap = new Map();

      vulReports.forEach((report) => {
        let repoRec = {};
        const mapKey = `${ report.imageMetadata.repository },${ report.imageMetadata.registry }`;
        const currImageScanResult = {};

        for (const key of severityKeys) {
          currImageScanResult[key] = report.report.summary[key];
        }
        if (repoMap.has(mapKey)) {
          const currRepo = repoMap.get(mapKey);

          for (const key of severityKeys) {
            currRepo.cveCntByRepo[key] += report.report.summary[key];
          }
          currRepo.images.push(
            {
              id:             report.id,
              imageMetadata:  report.imageMetadata,
              metadata:       { name: report.metadata.name },
              imageReference: constructImageName(report.imageMetadata),
              scanResult:     currImageScanResult,
            }
          );
          repoMap.set(mapKey, currRepo);
        } else {
          repoRec = {
            id:           mapKey,
            repository:   report.imageMetadata.repository,
            registry:     report.imageMetadata.registry,
            metadata:     { namespace: report.metadata.namespace },
            cveCntByRepo: { ...currImageScanResult },
            images:       [
              {
                id:             report.id,
                imageMetadata:  report.imageMetadata,
                metadata:       { name: report.metadata.name },
                imageReference: constructImageName(report.imageMetadata),
                scanResult:     currImageScanResult,
              }
            ]
          };
          repoMap.set(mapKey, repoRec);
        }
      });

      return Array.from(repoMap.values());
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
  }
  .header-section {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    align-self: stretch;
    border-radius: 6px;
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
    }
    .filter-dropdown {
      display: flex;
      width: 225px;
      height: 40px;
    }
  }
  .summary-section {
    display: flex;
    align-items: flex-start;
    align-self: stretch;
    border-radius: 6px;
    border: 1px solid #DCDEE7;
    background: #FFF;
    margin: 24px 0;
  }
  .table-filter-section {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    align-self: stretch;
    .table-filter {
      justify-content: center;
      align-items: flex-start;
      gap: 4px;
      flex: 1 0 0;
      .title {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
        align-self: stretch;
        overflow: hidden;
        color: var(--disabled-text);
        text-overflow: ellipsis;
        font-family: Lato;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 21px; /* 150% */
      }
    }
  }

  .filter-row {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
  }

  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
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
    line-height: 19px;
    background: transparent;
  }

  .score-input {
    color: #BEC1D2;
  }

  .score-input::placeholder {
    color: #BEC1D2;
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

</style>
