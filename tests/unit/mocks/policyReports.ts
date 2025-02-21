import {
  Resource, PolicyReportResult, PolicyReport, ClusterPolicyReport, Result, Severity
} from '@kubewarden/types';

export const mockResource: Resource = {
  apiVersion:      'v1',
  kind:            'Pod',
  name:            'example-pod',
  namespace:       'default',
  resourceVersion: '12345',
  uid:             'mock-pod-uid'
};

export const mockPolicyReportResult: PolicyReportResult = {
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

export const mockPolicyReport: PolicyReport = {
  apiVersion: 'policy.k8s.io/v1beta1',
  id:         'policyreport-123',
  kind:       'PolicyReport',
  metadata:   {
    labels:            { 'app.kubernetes.io/managed-by': 'kubewarden' },
    creationTimestamp: new Date(),
    name:              'policyreport-123',
    namespace:         'default',
  },
  results:    [mockPolicyReportResult],
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
  type: 'PolicyReport',
  uid:  'report-uid-123',
};

export const mockClusterPolicyReport: ClusterPolicyReport = {
  apiVersion: 'policy.k8s.io/v1beta1',
  id:         'clusterpolicyreport-123',
  kind:       'ClusterPolicyReport',
  metadata:   {
    labels:            { 'app.kubernetes.io/managed-by': 'kubewarden' },
    creationTimestamp: new Date(),
    name:              'clusterpolicyreport-123',
  },
  results:    [mockPolicyReportResult],
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
  type: 'ClusterPolicyReport',
  uid:  'report-uid-cluster-123',
};
