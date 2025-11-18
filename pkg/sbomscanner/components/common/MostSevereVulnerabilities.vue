<template>
  <div class="vulnerabilities-section">
    <div class="summary-title">
      {{ t('imageScanner.imageDetails.mostSevereVulnerabilities.title') }}
      <InfoTooltip
        style="margin-left: 8px;"
        :tooltip="t('imageScanner.imageDetails.mostSevereVulnerabilities.tooltip')"
      />
    </div>
    <div class="vulnerabilities-list">
      <div
        v-for="vuln in mostSevereVulnerabilities"
        :key="vuln.cveId"
      >
        <div
          v-if="vuln.cveId"
          class="row"
        >
          <div class="col" style="width: 200px;">
            <RouterLink :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${PAGE.VULNERABILITIES}/${vuln.cveId}`">
              {{ vuln.cveId }}
            </RouterLink>
          </div>
          <div class="col span-3">
            <ScoreBadge
              :score="vuln.score ? vuln.score.split(' ')[0] : ''"
              :score-type="vuln.score ? vuln.score.split(' ')[1].replace(/[()]/g, '') : ''"
              :severity="vuln.severity"
            />
          </div>
          <div class="col span-4">
            {{ vuln.package }}
          </div>
          <div class="col span-1">
            <FixAvailableIcon :fix-available="vuln.fixAvailable" />
          </div>
        </div>
        <div
          v-else
          class="row"
        >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ScoreBadge from '@sbomscanner/components/common/ScoreBadge';
import InfoTooltip from '@sbomscanner/components/common/Tooltip';
import { PRODUCT_NAME, PAGE } from '@sbomscanner/types';
import FixAvailableIcon from '@sbomscanner/components/common/FixAvailableIcon';
import { getHighestScore, getSeverityNum, getScoreNum } from '@sbomscanner/utils/report';
export default {
  name:       'MostSevereVulnerabilities',
  components: {
    ScoreBadge,
    InfoTooltip,
    FixAvailableIcon,
  },
  props: {
    vulnerabilityReport: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    return {
      PRODUCT_NAME,
      PAGE,
    };
  },
  computed: {
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

      const sortedVulnerabilities = vulnerabilities
        .sort((a, b) => {
          const scoreA = getScoreNum(getHighestScore(a.cvss));
          const scoreB = getScoreNum(getHighestScore(b.cvss));

          if ((scoreA > 0 || scoreB > 0) && scoreA !== scoreB) {
            return scoreB - scoreA;
          } else {
            // If same score or none, sort by severity (higher severity first)
            const severityA = getSeverityNum(a.severity);
            const severityB = getSeverityNum(b.severity);

            if (severityA !== severityB) {
              return severityB - severityA;
            }
          }
        })
        .slice(0, 5)
        .map((vuln) => ({
          cveId:        vuln.cve,
          score:        getHighestScore(vuln.cvss),
          severity:     vuln.severity?.toLowerCase() || null,
          package:      vuln.packageName,
          fixAvailable: vuln.fixedVersions && vuln.fixedVersions.length > 0
        }));

      if (sortedVulnerabilities.length < 5) {
        const placeholdersToAdd = 5 - sortedVulnerabilities.length;

        for (let i = 0; i < placeholdersToAdd; i++) {
          sortedVulnerabilities.push({
            cveId:        '',
            score:        '',
            severity:     null,
            package:      '',
            fixAvailable: null
          });
        }
      }

      // Transform to match the expected format for the UI
      return sortedVulnerabilities;
    },
  }
};
</script>

<style lang="scss" scoped>
.vulnerabilities-section {
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
  min-height: 24px;
}

.vulnerabilities-list .col {
  padding: 0 16px;
  min-height: 24px;
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
