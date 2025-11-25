import {
  imageDetailsToCSV, downloadCSV, downloadJSON, getScore, getSeverityNum, getScoreNum, getHighestScore
} from '../report';

describe('imageDetailsToCSV', () => {
  test('handles empty or null input', () => {
    expect(imageDetailsToCSV(null as any)).toEqual([]);
    expect(imageDetailsToCSV([])).toEqual([]);
  });

  test('converts vulnerabilities to CSV rows with correct field mapping and sanitization', () => {
    const vuls = [
      {
        cve: 'CVE-1', cvss: { nvd: { v3score: '9.8' } }, packageName: 'pkg', fixedVersions: ['1.0', '1.1'], severity: 'critical', suppressed: false, installedVersion: '0.9', purl: 'purl-1', description: 'desc "quote"\nnew line'
      },
      {
        cve: 'CVE-2', cvss: { redhat: { v3score: '7.0' } }, packageName: 'pkg2', fixedVersions: [], severity: 'high', suppressed: true, installedVersion: '2.0', purl: 'purl-2', description: 'another'
      },
      {
        cve: 'CVE-3', cvss: { ghsa: { v3score: '5.0' } }, packageName: 'pkg3', fixedVersions: null, severity: 'low', suppressed: false, installedVersion: '3.0', purl: 'purl-3', description: 'ok'
      },
      {
        cve: 'CVE-4', cvss: {}, packageName: 'pkg4', fixedVersions: ['a'], severity: 'none', suppressed: false, installedVersion: '4.0', purl: 'purl-4', description: 'no score'
      },
    ];

    const rows = imageDetailsToCSV(vuls as any) as any[];

    expect(rows.length).toBe(4);

    expect(rows[0]).toEqual({
      CVE_ID:            'CVE-1',
      SCORE:             '9.8 (v3)',
      PACKAGE:           'pkg',
      'FIX AVAILABLE':   '1.0, 1.1',
      SEVERITY:          'critical',
      EXPLOITABILITY:    'Affected',
      'PACKAGE VERSION': '0.9',
      'PACKAGE PATH':    'purl-1',
      DESCRIPTION:       "desc 'quote' new line",
    });

    expect(rows[1]).toEqual({
      CVE_ID:            'CVE-2',
      SCORE:             '7.0 (v3)',
      PACKAGE:           'pkg2',
      'FIX AVAILABLE':   '',
      SEVERITY:          'high',
      EXPLOITABILITY:    'Suppressed',
      'PACKAGE VERSION': '2.0',
      'PACKAGE PATH':    'purl-2',
      DESCRIPTION:       'another',
    });

    expect(rows[2]).toEqual({
      CVE_ID:            'CVE-3',
      SCORE:             '5.0 (v3)',
      PACKAGE:           'pkg3',
      'FIX AVAILABLE':   '',
      SEVERITY:          'low',
      EXPLOITABILITY:    'Affected',
      'PACKAGE VERSION': '3.0',
      'PACKAGE PATH':    'purl-3',
      DESCRIPTION:       'ok',
    });

    expect(rows[3]).toEqual({
      CVE_ID:            'CVE-4',
      SCORE:             '',
      PACKAGE:           'pkg4',
      'FIX AVAILABLE':   'a',
      SEVERITY:          'none',
      EXPLOITABILITY:    'Affected',
      'PACKAGE VERSION': '4.0',
      'PACKAGE PATH':    'purl-4',
      DESCRIPTION:       'no score',
    });
  });
});

describe('download utils', () => {
  let mockLink: any;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let createElementSpy: jest.SpyInstance;
  let mockCreateObjectURL: jest.Mock;

  beforeEach(() => {
    mockLink = {
      setAttribute: jest.fn(),
      click:        jest.fn(),
      style:        { visibility: '' },
      download:     '',
    };

    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

    // Mock URL.createObjectURL since it doesn't exist in JSDOM
    mockCreateObjectURL = jest.fn().mockReturnValue('mock-url');
    URL.createObjectURL = mockCreateObjectURL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up the global URL mock
    delete (URL as any).createObjectURL;
  });

  test('downloadCSV creates and clicks a link with the correct CSV content', () => {
    const csvContent = 'col1,col2\nval1,val2';
    const filename = 'report.csv';

    downloadCSV(csvContent, filename);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;

    expect(blob.type).toBe('text/csv;charset=utf-8;');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
    expect(mockLink.style.visibility).toBe('hidden');
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(mockLink.click).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
  });

  test('downloadJSON creates and clicks a link with the correct JSON content', () => {
    const jsonContent = '{"key": "value"}';
    const filename = 'report.json';

    downloadJSON(jsonContent, filename);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;

    expect(blob.type).toBe('application/json;charset=utf-8;');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
    expect(mockLink.style.visibility).toBe('hidden');
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(mockLink.click).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
  });

  test('downloadCSV does nothing if link.download is not supported', () => {
    const unsupportedLink = {
      setAttribute: jest.fn(),
      click:        jest.fn(),
      style:        { visibility: '' },
      // no 'download' property, so it will be undefined
    };

    createElementSpy.mockReturnValue(unsupportedLink as any);

    downloadCSV('content', 'file.csv');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
    expect(unsupportedLink.setAttribute).not.toHaveBeenCalled();
    expect(appendChildSpy).not.toHaveBeenCalled();
    expect(unsupportedLink.click).not.toHaveBeenCalled();
    expect(removeChildSpy).not.toHaveBeenCalled();
  });

  test('downloadJSON does nothing if link.download is not supported', () => {
    const unsupportedLink = {
      setAttribute: jest.fn(),
      click:        jest.fn(),
      style:        { visibility: '' },
    };

    createElementSpy.mockReturnValue(unsupportedLink as any);

    downloadJSON('content', 'file.json');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
    expect(unsupportedLink.setAttribute).not.toHaveBeenCalled();
    expect(appendChildSpy).not.toHaveBeenCalled();
    expect(unsupportedLink.click).not.toHaveBeenCalled();
    expect(removeChildSpy).not.toHaveBeenCalled();
  });
});

describe('getScore', () => {
  it('returns empty string when cvss is null or undefined', () => {
    expect(getScore(null as any, 'high')).toBe('');
    expect(getScore(undefined as any, 'low')).toBe('');
  });

  it('returns empty string when cvss is not an object', () => {
    expect(getScore('string' as any, 'medium')).toBe('');
    expect(getScore(123 as any, 'medium')).toBe('');
  });

  it('returns empty string when severity is missing or falsy', () => {
    expect(getScore({}, '')).toBe('');
    expect(getScore({}, undefined as any)).toBe('');
  });

  it('returns empty string for unknown severity values', () => {
    const cvss = { nvd: { v3score: 5.0 } };

    expect(getScore(cvss, 'unknown')).toBe('');
  });

  it('returns correct score for "none" severity (0.0)', () => {
    const cvss = { source1: { v3score: 0.0 } };

    expect(getScore(cvss, 'none')).toBe('0 (v3)');
  });

  it('returns score that matches the "low" range (0.1–3.9)', () => {
    const cvss = {
      srcA: { v3score: 3.5 },
      srcB: { v3score: 6.0 },
    };

    expect(getScore(cvss, 'low')).toBe('3.5 (v3)');
  });

  it('returns score that matches the "medium" range (4.0–6.9)', () => {
    const cvss = {
      srcA: { v3score: '4.2' },
      srcB: { v3score: 8.5 },
    };

    expect(getScore(cvss, 'medium')).toBe('4.2 (v3)');
  });

  it('returns score that matches the "high" range (7.0–8.9)', () => {
    const cvss = {
      srcA: { v3score: 7.1 },
      srcB: { v3score: 9.5 },
    };

    expect(getScore(cvss, 'high')).toBe('7.1 (v3)');
  });

  it('returns score that matches the "critical" range (9.0–10.0)', () => {
    const cvss = {
      srcA: { v3score: 9.9 },
      srcB: { v3score: 5.0 },
    };

    expect(getScore(cvss, 'critical')).toBe('9.9 (v3)');
  });

  it('skips NaN and invalid v3score values', () => {
    const cvss = {
      srcA: { v3score: 'NaN' },
      srcB: { v3score: 'invalid' },
      srcC: { v3score: 6.5 },
    };

    expect(getScore(cvss, 'medium')).toBe('6.5 (v3)');
  });

  it('returns fallback first score if no score fits the range', () => {
    const cvss = {
      srcA: { v3score: 1.0 },
      srcB: { v3score: 2.0 },
    };

    expect(getScore(cvss, 'high')).toBe('1 (v3)');
  });

  it('returns empty string if cvss object has no valid v3score', () => {
    const cvss = {
      srcA: { v2score: 4.0 },
      srcB: { irrelevant: true },
    };

    expect(getScore(cvss, 'low')).toBe('');
  });

  it('handles mixed types (string and number) and ensures correct numeric parsing', () => {
    const cvss = {
      srcA: { v3score: '8.5' },
      srcB: { v3score: 5.5 },
    };

    expect(getScore(cvss, 'high')).toBe('8.5 (v3)');
  });

  it('normalizes severity case (e.g., "HIGH", "Medium")', () => {
    const cvss = {
      srcA: { v3score: 8.5 },
      srcB: { v3score: 4.5 },
    };

    expect(getScore(cvss, 'HIGH')).toBe('8.5 (v3)');
    expect(getScore(cvss, 'Medium')).toBe('4.5 (v3)');
  });
});

describe('getSeverityNum', () => {
  it('returns correct number for critical severity', () => {
    expect(getSeverityNum('critical')).toBe(5);
    expect(getSeverityNum('CRITICAL')).toBe(5); // case-insensitive
  });

  it('returns correct number for high severity', () => {
    expect(getSeverityNum('high')).toBe(4);
  });

  it('returns correct number for medium severity', () => {
    expect(getSeverityNum('medium')).toBe(3);
  });

  it('returns correct number for low severity', () => {
    expect(getSeverityNum('low')).toBe(2);
  });

  it('returns correct number for none severity', () => {
    expect(getSeverityNum('none')).toBe(1);
  });

  it('returns 0 for unknown or undefined severity', () => {
    expect(getSeverityNum('unknown')).toBe(0);
    expect(getSeverityNum('')).toBe(0);
    expect(getSeverityNum(undefined as unknown as string)).toBe(0);
    expect(getSeverityNum(null as unknown as string)).toBe(0);
  });
});

describe('getScoreNum', () => {
  it('returns 0 if scoreStr is empty', () => {
    expect(getScoreNum('')).toBe(0);
    expect(getScoreNum(null as any)).toBe(0);
    expect(getScoreNum(undefined as any)).toBe(0);
  });

  it('parses a valid score string with (v3)', () => {
    expect(getScoreNum('7.5 (v3)')).toBe(7.5);
    expect(getScoreNum('10.0 (v3)')).toBe(10.0);
    expect(getScoreNum('0.1 (v3)')).toBe(0.1);
  });

  it('handles score strings with extra spaces', () => {
    expect(getScoreNum('  5.4   (v3)  ')).toBe(5.4);
    expect(getScoreNum('8.9(v3)')).toBe(8.9);
  });

  it('returns 0 for invalid score strings', () => {
    expect(getScoreNum('abc (v3)')).toBe(0);
    expect(getScoreNum('(v3)')).toBe(0);
    expect(getScoreNum('no-score')).toBe(0);
  });

  it('returns 0 if number part is not finite', () => {
    expect(getScoreNum('NaN (v3)')).toBe(0);
    expect(getScoreNum('Infinity (v3)')).toBe(0);
  });

  it('returns 0 if string does not contain (v3)', () => {
    expect(getScoreNum('7.5')).toBe(0);
    expect(getScoreNum('7.5 (v2)')).toBe(0);
  });
});

describe('getHighestScore', () => {
  it('returns highest v3score with (v3) suffix', () => {
    const cvss = {
      nvd:    { v3score: 5.6 },
      ghsa:   { v3score: 8.2 },
      custom: { v3score: 7.5 },
    };

    expect(getHighestScore(cvss)).toBe('8.2 (v3)');
  });

  it('handles v3score as string and number correctly', () => {
    const cvss = {
      nvd:  { v3score: '4.1' },
      ghsa: { v3score: 9 },
    };

    expect(getHighestScore(cvss)).toBe('9.0 (v3)');
  });

  it('returns empty string if no valid v3score is present', () => {
    const cvss = {
      nvd:   { v2score: 6.3 },
      other: {},
    };

    expect(getHighestScore(cvss)).toBe('');
  });

  it('ignores non-finite or invalid scores', () => {
    const cvss = {
      nvd:    { v3score: 'NaN' },
      ghsa:   { v3score: 'abc' },
      custom: { v3score: null },
    };

    expect(getHighestScore(cvss)).toBe('');
  });

  it('returns empty string for non-object input', () => {
    expect(getHighestScore(null)).toBe('');
    expect(getHighestScore(undefined)).toBe('');
    expect(getHighestScore('string')).toBe('');
    expect(getHighestScore(42)).toBe('');
  });

  it('handles mixed valid and invalid scores and picks highest', () => {
    const cvss = {
      nvd:    { v3score: '8.5' },
      ghsa:   { v3score: null },
      custom: { v3score: 9.1 },
      extra:  { v3score: 'not-a-number' },
    };

    expect(getHighestScore(cvss)).toBe('9.1 (v3)');
  });

  it('formats 10 exactly as "10 (v3)" instead of 10.0', () => {
    const cvss = {
      nvd:   { v3score: 10 },
      other: { v3score: 9.9 },
    };

    expect(getHighestScore(cvss)).toBe('10 (v3)');
  });

  it('rounds lower scores to one decimal place', () => {
    const cvss = { nvd: { v3score: 6 } };

    expect(getHighestScore(cvss)).toBe('6.0 (v3)');
  });
});
