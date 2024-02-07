import { V1ObjectMeta } from '@kubernetes/client-node';

import { Links } from './core';

export const POLICY_REPORTER_PRODUCT = 'policy-reporter';
export const POLICY_REPORTER_RESOURCE = 'PolicyReporter';
export const POLICY_REPORTER_CHART = 'policy-reporter';

export const POLICY_REPORTER_REPO = 'https://kyverno.github.io/policy-reporter';

export type Resource = {
  apiVersion: string;
  kind: string;
  name: string;
  namespace?: string;
  uid: string;
}

/* eslint-disable no-unused-vars */
export enum Severity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum Result {
  SKIP = 'skip',
  PASS = 'pass',
  WARN = 'warn',
  FAIL = 'fail',
  ERROR = 'error'
}
/* eslint-enable no-unused-vars */

export type PolicyReportSummary = {
  pass?: number;
  fail?: number;
  warn?: number;
  error?: number;
  skip?: number;
}

export type PolicyReportResult = {
  message: string;
  policy: string;
  rule: string;
  priority?: string;
  status?: string;
  source?: string;
  severity?: string;
  category?: string;
  properties?: {[key: string]: string};
  scored: boolean;
  result?: string;
  resources?: Resource[];
  uid?: string;
}

export type PolicyReport = {
  apiVersion: string;
  id: string;
  kind: string;
  links?: Links;
  metadata: V1ObjectMeta;
  results?: Array<PolicyReportResult>
  scope?: {
    name?: string;
    uid?: string;
  }
  summary?: PolicyReportSummary
  type: string;
  uid: string;
}