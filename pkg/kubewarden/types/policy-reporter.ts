import { V1ObjectMeta } from '@kubernetes/client-node';

import { Links } from './core';

export const POLICY_REPORTER_PRODUCT = 'policy-reporter';
export const POLICY_REPORTER_RESOURCE = 'PolicyReporter';
export const POLICY_REPORTER_CHART = 'policy-reporter';

export const POLICY_REPORTER_REPO = 'https://kyverno.github.io/policy-reporter';

export interface Resource {
  apiVersion: string;
  fieldPath?: string;
  kind: string;
  name: string;
  namespace?: string;
  resourceVersion: string;
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

export interface PolicyReportSummary {
  pass?: number;
  fail?: number;
  warn?: number;
  error?: number;
  skip?: number;
}

export interface PolicyReportResult {
  category?: string;
  message?: string;
  namespace?: string;
  policy: string;
  policyName?: string;
  properties?: {[key: string]: string};
  resourceSelector?: {
    matchExpressions?: {
      key: string;
      operator: string;
      values?: string[];
    };
    matchLabels?: {[key: string]: string};
  };
  resources?: Resource[];
  result?: Result;
  rule?: string;
  scope?: {
    apiVersion: string;
    kind: string;
    name: string;
    namespace?: string;
    uid?: string;
  },
  scored?: boolean;
  severity?: Severity;
  source?: string;
  timestamp?: {
    nanos: number;
    seconds: number;
  }
}

export interface PolicyReport {
  apiVersion: string;
  id: string;
  kind: string;
  links?: Links;
  metadata: V1ObjectMeta;
  results?: Array<PolicyReportResult>
  scope?: {
    apiVersion: string;
    kind: string;
    name: string;
    namespace?: string;
    uid?: string;
  }
  summary?: PolicyReportSummary
  type: string;
  uid: string;
}