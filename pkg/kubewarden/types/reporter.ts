import { V1ObjectMeta } from '@kubernetes/client-node';

import { Links } from './core';

export const REPORTER_PRODUCT = 'policy-reporter';

export interface Resource {
  apiVersion: string;
  fieldPath?: string;
  kind: string;
  name: string;
  namespace?: string;
  resourceVersion: string;
  uid: string;
}

export interface Scope {
  apiVersion: string;
  kind: string;
  name: string;
  namespace?: string;
  uid?: string;
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

export interface ReportSummary {
  pass?: number;
  fail?: number;
  warn?: number;
  error?: number;
  skip?: number;
}

export interface ReportResult {
  category?: string;
  kind?: string;
  message?: string;
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
  scope?: Scope;
  scored?: boolean;
  severity?: Severity;
  source?: string;
  timestamp?: {
    nanos: number;
    seconds: number;
  }
}

export interface Report {
  apiVersion: string;
  id: string;
  kind: string;
  links?: Links;
  metadata: V1ObjectMeta;
  results?: Array<ReportResult>
  scope?: Scope
  source?: string;
  summary?: ReportSummary
  type: string;
  uid: string;
}

export interface ClusterReport extends Report {
  scope: Scope;
}
