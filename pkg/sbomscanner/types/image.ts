export interface AmountBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
}

export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH:     'high',
  MEDIUM:   'medium',
  LOW:      'low',
  NONE:     'none',
};

export interface CVSSScore {
  v3vector: string;
  v3score: string;
}
export interface ImageVulnerability {
  cve: string;
  title: string;
  packageName: string;
  purl: string;
  installedVersion: string;
  fixedVersions: string[];
  diffID: string;
  description: string;
  severity: string;
  references: string[];
  cvss: { [key: string]: CVSSScore };
  suppressed: boolean;
}
