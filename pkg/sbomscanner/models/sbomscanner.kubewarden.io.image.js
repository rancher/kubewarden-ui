import SteveModel from '@shell/plugins/steve/steve-class';
import { PRODUCT_NAME, PAGE } from '@sbomscanner/types';

export default class Image extends SteveModel {
  get _availableActions() {
    const out = super._availableActions || [];

    // Remove download actions and View in API, keep edit YAML and clone
    const remove = new Set([
      'download',
      'downloadYaml',
      'downloadyaml',
      'viewYaml',
      'goToViewYaml',
      'viewInApi',
      'showConfiguration',
    ]);

    return out.filter((a) => !a?.action || !remove.has(a.action));
  }

  get listLocation() {
    return { name: `c-cluster-${ PRODUCT_NAME }-${ PAGE.IMAGES }` };
  }

  get doneOverride() {
    return this.listLocation;
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  // Get the vulnerability report associated with this image
  get vulnerabilityReport() {
    if (!this.metadata?.name) return null;

    try {
      const reports = this.$store.getters['cluster/all']('storage.sbomscanner.kubewarden.io.vulnerabilityreport');

      if (!reports || reports.length === 0) return null;

      const found = reports.find((report) => report.metadata?.name === this.metadata.name
      );

      return found;
    } catch (error) {
      return null;
    }
  }

  // Get the SBOM associated with this image
  get sbom() {
    if (!this.metadata?.name) return null;

    try {
      const sboms = this.$store.getters['cluster/all']('storage.sbomscanner.kubewarden.io.sbom');

      if (!sboms || sboms.length === 0) return null;

      const found = sboms.find((sbom) => sbom.metadata?.name === this.metadata.name
      );

      return found;
    } catch (error) {
      return null;
    }
  }

  // Get vulnerability details from the vulnerability report
  get vulnerabilityDetails() {
    const report = this.vulnerabilityReport;

    if (!report?.spec?.report) return [];

    try {
      const reportData = typeof report.spec.report === 'string' ? JSON.parse(report.spec.report) : report.spec.report;

      return reportData.vulnerabilities || [];
    } catch (error) {
      return [];
    }
  }

  // Get severity distribution from the vulnerability report
  get severityDistribution() {
    const report = this.vulnerabilityReport;

    if (!report?.spec?.report) {
      return {
        critical: 0, high: 0, medium: 0, low: 0, none: 0
      };
    }

    try {
      const reportData = typeof report.spec.report === 'string' ? JSON.parse(report.spec.report) : report.spec.report;

      return reportData.summary?.severityDistribution || {
        critical: 0, high: 0, medium: 0, low: 0, none: 0
      };
    } catch (error) {
      return {
        critical: 0, high: 0, medium: 0, low: 0, none: 0
      };
    }
  }

  // Get total vulnerability count
  get totalVulnerabilities() {
    const distribution = this.severityDistribution;

    return Object.values(distribution).reduce((sum, count) => sum + count, 0);
  }

  // Get overall severity (highest severity with count > 0)
  get overallSeverity() {
    const severities = ['critical', 'high', 'medium', 'low', 'none'];
    const distribution = this.severityDistribution;

    for (const severity of severities) {
      if (distribution[severity] > 0) {
        return severity;
      }
    }

    return 'none';
  }
}
