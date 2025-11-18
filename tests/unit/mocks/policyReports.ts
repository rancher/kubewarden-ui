import {
  Resource, ReportResult, Report, ClusterReport, Result, Severity
} from '@kubewarden/types';

export const mockResource: Resource = {
  apiVersion:      'v1',
  kind:            'Pod',
  name:            'example-pod',
  namespace:       'default',
  resourceVersion: '12345',
  uid:             'mock-pod-uid'
};

export const mockReportResult: ReportResult = {
  category:  'security',
  message:   'Pod lacks a security policy',
  policy:    'require-pod-security-policy',
  result:    Result.FAIL,
  severity:  Severity.HIGH,
  source:    'Kubewarden',
  timestamp: {
    nanos:   0,
    seconds: 1616141520
  },
  resources: [mockResource],
};

export const mockReport: Report = {
  apiVersion: 'openreports.io/v1alpha1',
  id:         'report-123',
  kind:       'Report',
  metadata:   {
    labels:            { 'app.kubernetes.io/managed-by': 'kubewarden' },
    creationTimestamp: new Date(),
    name:              'report-123',
    namespace:         'default',
  },
  results:    [mockReportResult],
  scope:      {
    apiVersion: 'v1',
    kind:       'pod',
    name:       'mock-pod',
    uid:        'mock-pod-uid',
  },
  summary: {
    fail:  1,
    pass:  0,
    warn:  0,
    error: 0,
    skip:  0,
  },
  type: 'openreports.io.report',
  uid:  'report-uid-123',
};

export const mockClusterReport: ClusterReport = {
  apiVersion: 'openreports.io/v1alpha1',
  id:         'clusterreport-123',
  kind:       'ClusterReport',
  metadata:   {
    labels:            { 'app.kubernetes.io/managed-by': 'kubewarden' },
    creationTimestamp: new Date(),
    name:              'clusterreport-123',
  },
  results:    [mockReportResult],
  scope:      {
    apiVersion: 'v1',
    kind:       'Cluster',
    name:       'cluster-wide',
    uid:        'cluster-wide-uid',
  },
  summary: {
    fail:  1,
    pass:  0,
    warn:  0,
    error: 0,
    skip:  0,
  },
  type: 'openreports.io.clusterreport',
  uid:  'report-uid-cluster-123',
};
