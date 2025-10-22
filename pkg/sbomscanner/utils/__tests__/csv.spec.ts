import { imageDetailsToCSV } from '../csv';

describe('csv util', () => {
  test('handles empty or null input', () => {
    expect(imageDetailsToCSV(null as any)).toEqual([]);
    expect(imageDetailsToCSV([])).toEqual([]);
  });

  test('converts vulnerabilities to CSV rows with SCORE selection and sanitizes description', () => {
    const vuls = [
      { cve: 'CVE-1', cvss: { nvd: { v3score: '9.8' } }, packageName: 'pkg', fixedVersions: ['1.0'], severity: 'critical', suppressed: false, installedVersion: '1.2', purl: 'purl', description: 'desc "quote"\nnew line' },
      { cve: 'CVE-2', cvss: { redhat: { v3score: '7.0' } }, packageName: 'pkg2', fixedVersions: [], severity: 'high', suppressed: true, installedVersion: '2.0', purl: 'purl2', description: 'another' },
      { cve: 'CVE-3', cvss: { ghsa: { v3score: '5.0' } }, packageName: 'pkg3', fixedVersions: null, severity: 'low', suppressed: false, installedVersion: '3.0', purl: 'purl3', description: 'ok' },
      { cve: 'CVE-4', cvss: {}, packageName: 'pkg4', fixedVersions: ['a'], severity: 'none', suppressed: false, installedVersion: '4.0', purl: 'purl4', description: 'no score' },
    ];

  const rows = imageDetailsToCSV(vuls as any) as any[];

    expect(rows.length).toBe(4);
    expect(rows[0].SCORE).toContain('9.8');
    expect(rows[0].DESCRIPTION).not.toContain('"');
    expect(rows[0].DESCRIPTION).toContain('new line');
    expect(rows[1].SCORE).toContain('7.0');
    expect(rows[2].SCORE).toContain('5.0');
    expect(rows[3].SCORE).toBe('');
  });
});
