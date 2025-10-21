import { ImageVulnerability } from "@pkg/types";

export function imageDetailsToCSV(vuls: ImageVulnerability[]): Object[] {
  return vuls.map((vul) => {
    return {
      CVE_ID: vul.cve,
      SCORE: vul.cvss?.nvd?.v3score ? `${ vul.cvss.nvd.v3score } (CVSS v3)` : vul.cvss?.redhat?.v3score ? `${ vul.cvss.redhat.v3score } (CVSS v3)` : vul.cvss?.ghsa?.v3score ? `${ vul.cvss.ghsa.v3score } (CVSS v3)` : '',
      PACKAGE: vul.packageName,
      "FIX AVAILABLE": vul.fixedVersions ? vul.fixedVersions.join(', ') : '',
      SEVERITY: vul.severity,
      EXPLOITABILITY: vul.suppressed ? 'Suppressed' : 'Affected',
      "PACKAGE VERSION": vul.installedVersion,
      "PACKAGE PATH": vul.purl,
      DESCRIPTION: vul.description.replace(/\"/g, "'").replace(/[\r\n]+/g, ' '),
    };
  });
}
