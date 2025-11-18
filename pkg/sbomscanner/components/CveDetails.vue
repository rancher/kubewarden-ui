<script>
import { BadgeState } from '@components/BadgeState';

import { PRODUCT_NAME, RESOURCE, PAGE } from '@sbomscanner/types';
import { NVD_BASE_URL, CVSS_VECTOR_BASE_URL } from '@sbomscanner/constants';
import { getHighestScore } from '@sbomscanner/utils/report';

export default {
  name:       'CveDetails',
  components: { BadgeState },
  data() {
    return {
      PRODUCT_NAME,
      RESOURCE,
      PAGE,
      cveDetail:   null,
      hoverVendor: null,
      inside:      false,
    };
  },

  methods: {
    async loadData() {
      const vulReport = await this.$store.dispatch('cluster/findAll', { type: RESOURCE.VULNERABILITY_REPORT });

      const cveId = this.$route.params.id;

      const { cveMetaData, totalScanned } = this.getCveMetaData(vulReport, cveId);

      this.totalScanned = totalScanned;

      this.cveDetail = {
        ...cveMetaData,
        id:          cveId,
        totalImages: totalScanned,
      };
    },

    getCveMetaData(vulReports, cveId) {
      let cveMetaData = null;

      for (const report of vulReports) {
        const results = report?.report?.results || [];

        for (const result of results) {
          for (const vuln of result.vulnerabilities || []) {
            if (vuln.cve === cveId) {
              if (!cveMetaData) {
                const hasCvss = !!vuln.cvss;

                cveMetaData = {
                  score:           hasCvss ? getHighestScore(vuln.cvss) : 'n/a',
                  sources:         hasCvss ? this.convertCvssToSources(vuln.cvss, cveId) : [],
                  severity:        vuln.severity,
                  cvssScores:      hasCvss ? this.convertCvss(vuln.cvss) : [],
                  title:           vuln.title,
                  advisoryVendors: this.groupReferencesByDomain(vuln.references),
                };
              }

              return {
                cve: cveId, cveMetaData, totalScanned: vulReports.length
              };
            }
          }
        }
      }

      return {
        cve: cveId, cveMetaData, totalScanned: vulReports.length
      };
    },

    groupReferencesByDomain(urls) {
      const vendorMap = new Map();

      urls.forEach((url) => {
        const { hostname } = new URL(url);

        // extract domain base (drop subdomains)
        let name = hostname.replace(/^www\./, '');
        const parts = name.split('.');

        if (parts.length > 2) {
          name = parts[parts.length - 2];
        } else {
          name = parts[0];
        }

        // Capitalize first letter
        name = name.charAt(0).toUpperCase() + name.slice(1);
        if ( !vendorMap.has(name) ) {
          vendorMap.set( name, []);
        }
        vendorMap.get(name).push(url);
      });

      return Array.from(vendorMap.entries()).map(
        ([name, references]) => ({
          name,
          references,
        })
      );
    },

    convertCvss(cvssObj) {
      const cvssScores = [];

      Object.entries(cvssObj).forEach(([source, values]) => {
        const vector = values.v3vector || '';
        let version = '';

        if (vector.startsWith('CVSS:3.1')) {
          version = '3-1#';
        } else if (vector.startsWith('CVSS:3.0')) {
          version = '3-0#';
        }

        Object.entries(values).forEach(([key, val]) => {
          if (key.toLowerCase().includes('score')) {
            cvssScores.push({
              source: `${ source.charAt(0).toUpperCase() + source.slice(1) } ${ key }`,
              score:  val,
              link:   vector ? `${ CVSS_VECTOR_BASE_URL }${ version }${ vector }` : ''
            });
          }
        });
      });

      return cvssScores;
    },

    convertCvssToSources(cvss, cveId) {
      return Object.keys(cvss).map((key) => {
        const isNvd = key.toUpperCase().includes('NVD');

        return {
          name: key.toUpperCase(),
          link: isNvd ? `${ NVD_BASE_URL }${ cveId }` : ''
        };
      });
    }

  },

  watch: {
    '$route.params.id': {
      immediate: true,
      handler() {
        this.loadData();
      }
    }
  }
};
</script>
<template>
  <div class="page">
    <div class="about">
      <div class="header-section">
        <div class="title">
          <span class="resource-header-name">
            <!-- <RouterLink :to="`/c/${this.$route.params.cluster}/${this.PRODUCT_NAME}/${this.PAGE.VULNERABILITIES}`">{{ t('imageScanner.vulnerabilities.title') }}:</RouterLink> -->
            {{ t('imageScanner.vulnerabilities.title') }}: {{ $route.params.id }}
          </span>
          <BadgeState
            :color="cveDetail?.severity?.toLowerCase()"
            :label="t(`imageScanner.enum.cve.${cveDetail?.severity?.toLowerCase()}`)"
            class="severity-badge"
          />
        </div>
      </div>
      <!--    description -->
      <span class="description">{{ cveDetail?.title || t('imageScanner.general.unknown') }}</span>
      <!--  meta data  -->
      <div class="stats">
        <div class="column column-1">
          <div class="stats-item">
            <div class="stat-item">
              <span class="label">{{ t('imageScanner.vulnerabilities.details.score') }}:</span>
              <span class="value">{{ cveDetail?.score || t('imageScanner.general.unknown') }}</span>
            </div>
            <div class="stat-item">
              <span class="label">{{ t('imageScanner.vulnerabilities.details.imageIdentifiedIn') }}:</span>
              <span class="value">{{ cveDetail?.totalImages || t('imageScanner.general.unknown') }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Sources</span>
              <span
                v-if="cveDetail?.sources?.length"
                class="value"
              >
                <span
                  v-for="(source, index) in cveDetail?.sources"
                  :key="index"
                >
                  <template v-if="source.link">
                    <a
                      :href="source.link"
                      target="_blank"
                      class="source-link"
                    >
                      {{ source.name }} <i class="ml-8 icon icon-external-link" />
                    </a>
                  </template>
                  <template v-else>
                    {{ source.name }}
                  </template>
                  <span v-if="index < cveDetail?.sources?.length - 1">, </span>
                </span>
              </span>
              <span
                v-else
                class="value"
              >{{ t('imageScanner.general.unknown') }}</span>
            </div>
          </div>
        </div>
        <div class="column column-2">
          <div class="stat-item">
            <span class="label"> Advisory vendors </span>
            <span class="value">{{ cveDetail?.advisoryVendors?.length || t('imageScanner.general.unknown') }}</span>
          </div>
          <div
            class="vendor-tags-wrapper"
            @mouseenter="inside = true"
            @mouseleave="inside = false; hoverVendor = null"
          >
            <div class="vendor-tags">
              <span
                v-for="(vendor, index) in cveDetail?.advisoryVendors"
                :key="index"
                class="vendor-tag"
                @mouseenter="hoverVendor = vendor"
              >
                {{ vendor.name }}
              </span>
            </div>

            <!-- Hover panel (always aligned with first tag) -->
            <div
              v-if="hoverVendor && inside"
              class="hover-panel"
            >
              <h4>References for {{ cveDetail?.id }}</h4>
              <div
                v-for="(ref, rIndex) in hoverVendor.references"
                :key="rIndex"
                class="ref-item"
              >
                <a
                  :href="ref"
                  target="_blank"
                  class="ref-url"
                >{{ ref }}</a>
              </div>
            </div>
          </div>
        </div>
        <div class="column column-3">
          <div class="stat-item">
            <span class="label">CVSS scores</span>
            <span class="value">{{ cveDetail?.cvssScores?.length || t('imageScanner.general.unknown') }}</span>
          </div>
          <div class="cvss-list">
            <a
              v-for="(score, index) in cveDetail?.cvssScores"
              :key="index"
              :href="score.link"
              target="_blank"
              class="cvss-link"
            >
              {{ score.source }} {{ score.score }}
              <i class="ml-8 icon icon-external-link"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/_variables.scss';

.btn {
  padding: 0 16px;
  gap: 12px;
}

.about {
  /* layout */
  display: flex;
  padding-bottom: 20px;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  /* style */
  border-bottom: dashed var(--border-width) var(--input-border);
}

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
  align-items: center;
  gap: 24px;
  align-self: stretch;

  .title {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1 0 0;
    font-family: Lato;
    font-size: 24px;
    font-style: normal;
    font-weight: 400;
  }

  .filter-dropdown {
    display: flex;
    width: 225px;
    height: 40px;
  }
}

.description {
  display: flex;
  max-width: 900px;
  max-height: calc(21px * 3);
  flex-direction: column;
  justify-content: center;
  overflow-y: auto;
  color: var(--disabled-text);
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: flex-start;
  row-gap: 4px;
  column-gap: 24px;
  align-self: stretch;
  margin-top: 16px;
}

.stat-item {
  display: flex;
  align-items: flex-start;
  align-self: stretch;
  font-family: Lato;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 21px;
  margin-bottom: 4px;
}
.label {
  display: flex;
  width: 144px;
  align-items: center;
  gap: 8px;
  color: var(--disabled-text);
}
.value {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 0 0;
}
.vendor-tags-wrapper {
  position: relative;
  display: inline-block;
  margin-top: 5px;
}
.vendor-tags {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}
.vendor-tag {
  margin-right: 5px;
  padding: 1px 6px;
  background-color: transparent;
  border: solid var(--border-width) var(--input-border);
  border-radius: 4px;
  cursor: pointer;
}
.vendor-tag:hover {
  background-color: #d1d3e0;
}
.hover-panel {
  position: absolute;
  top: 20px;
  left: 0;
  background: var(--input-bg);
  border: solid var(--border-width) var(--input-border);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  border-radius: 8px;
  padding: 12px;

  min-width: 400px;
  max-width: 500px;
  width: auto;
  box-sizing: border-box;

  z-index: 1000;
}
.hover-panel h4 {
  margin: 0 0 6px;
  font-size: 14px;
}

.hover-panel a {
  color: #007acc;
  text-decoration: none;
}

.hover-panel a:hover {
  text-decoration: underline;
}

.ref-item {
  margin-bottom: 10px;
}

.ref-url {
  display: inline-flex;
  color: #5696ce;
  text-decoration: none;
  word-break: break-all;
}

.cvss-list {
  display: flex;
  flex-direction: column;
}

.cvss-link {
  display: inline-flex;
  align-items: center;
  color: #5696ce;
  text-decoration: none;
  margin-bottom: 5px;
  width: fit-content;
}

.source-link {
  color: #5696ce;
  text-decoration: none;
  margin-bottom: 5px;
}

.cvss-link:hover, .source-link:hover {
  text-decoration: underline;
}

.severity-badge {
  font-size: 12px;
  font-weight: 400;
  margin: auto 0;
  &.critical {
    background: $critical-color;
    color:      white !important;
  }

  &.high {
    background: $high-color;
    color:      white !important;
  }

  &.medium {
    background: $medium-color;
    color:      white !important;
  }

  &.low {
    background: $low-color;
    color:      white !important;
  }

  &.na{
    background: $na-color;
    color:      #717179 !important;
  }

  &.none{
    background: $na-color;
    color:      #717179 !important;
  }

  &.unknown{
    background: $na-color;
    color:      #717179 !important;
  }
}

.ml-8 {
  margin-left: 8px;
}
</style>
