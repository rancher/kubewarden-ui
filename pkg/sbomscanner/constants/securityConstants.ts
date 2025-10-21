export const NVD_BASE_URL = 'https://nvd.nist.gov/vuln/detail/';
export const CVSS_VECTOR_BASE_URL = 'https://www.first.org/cvss/calculator/';
export const SCAN_INTERVALS = {
  ONE_HOUR:          '1h',
  THREE_HOURS:       '3h',
  SIX_HOURS:         '6h',
  TWELVE_HOURS:      '12h',
  TWENTY_FOUR_HOURS: '24h',
  MANUAL:            '0s'
};

export const SCAN_INTERVAL_OPTIONS = [
  { label: 'Every 1 hour', value: SCAN_INTERVALS.ONE_HOUR },
  { label: 'Every 3 hours', value: SCAN_INTERVALS.THREE_HOURS },
  { label: 'Every 6 hours', value: SCAN_INTERVALS.SIX_HOURS },
  { label: 'Every 12 hours', value: SCAN_INTERVALS.TWELVE_HOURS },
  { label: 'Every 24 hours', value: SCAN_INTERVALS.TWENTY_FOUR_HOURS },
  { label: 'Manual Scan', value: SCAN_INTERVALS.MANUAL } // backend disables auto-scan
];

export const REGISTRY_TYPE = {
  OCI_DISTRIBUTION:  'OCIDistribution',
  NO_CATALOG:       'NoCatalog'
};

export const REGISTRY_TYPE_OPTIONS = [
  { label: 'OCI Distribution', value: REGISTRY_TYPE.OCI_DISTRIBUTION },
  { label: 'No Catalog', value: REGISTRY_TYPE.NO_CATALOG }
];
