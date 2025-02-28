import { Store } from 'vuex';

import * as policyReporterModule from '@kubewarden/modules/policyReporter';
import { KUBEWARDEN, Severity, Result } from '@kubewarden/types';
import { mockPolicyReport, mockClusterPolicyReport } from '@tests/unit/mocks/policyReports';
import { mockControllerApp } from '@tests/unit/mocks/controllerApp';

jest.mock('lodash/isEmpty', () => ({
  __esModule: true,
  default:    jest.fn().mockImplementation((data) => {
    if (Array.isArray(data)) {
      return data.length === 0;
    }

    return Object.keys(data || {}).length === 0;
  }),
}));

jest.mock('@shell/utils/string', () => ({ randomStr: jest.fn().mockReturnValue('randomString') }));

const mockStore = {
  getters: {
    'cluster/schemaFor':               jest.fn(),
    'cluster/all':                     jest.fn(),
    'kubewarden/reportByResourceId':   jest.fn(),
    'kubewarden/policyReports':        [mockPolicyReport],
    'kubewarden/clusterPolicyReports': [mockClusterPolicyReport],
    'kubewarden/controllerApp':        mockControllerApp
  },
  dispatch: jest.fn()
} as unknown as Store<any>;

beforeEach(() => {
  jest.clearAllMocks();

  // Clear the report cache so each test runs fresh.
  policyReporterModule.__clearReportCache();

  // Return a mock schema for any type.
  mockStore.getters['cluster/schemaFor'].mockReturnValue(true);

  // Assume no reports are cached by default so that findAll is triggered.
  mockStore.getters['cluster/all'].mockReturnValue([]);

  // Default: no report is found by resource ID.
  mockStore.getters['kubewarden/reportByResourceId'].mockReturnValue(null);

  // Polyfill requestIdleCallback for test environment if missing.
  global.requestIdleCallback = (cb) => setTimeout(cb, 0);
});

describe('getReports', () => {
  it('should fetch and dispatch cluster policy reports when cluster level is true', async() => {
    (mockStore.dispatch as jest.Mock).mockResolvedValueOnce([mockClusterPolicyReport]);

    const reports = await policyReporterModule.getReports(mockStore, true);

    expect(reports).toEqual([mockClusterPolicyReport]);
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      'kubewarden/updateClusterPolicyReports',
      [mockClusterPolicyReport]
    );
    expect(mockStore.dispatch).toHaveBeenCalledWith('kubewarden/regenerateSummaryMap');
  });

  it('should fetch and dispatch policy reports when cluster level is false', async() => {
    (mockStore.dispatch as jest.Mock).mockResolvedValueOnce([mockPolicyReport]);

    const reports = await policyReporterModule.getReports(mockStore, false);

    expect(reports).toEqual([mockPolicyReport]);
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      'kubewarden/updatePolicyReports',
      [mockPolicyReport]
    );
    expect(mockStore.dispatch).toHaveBeenCalledWith('kubewarden/regenerateSummaryMap');
  });

  it('should fetch and dispatch policy reports when cluster level is false and resourceType is specified', async() => {
    (mockStore.dispatch as jest.Mock).mockResolvedValueOnce([mockPolicyReport]);

    const reports = await policyReporterModule.getReports(mockStore, false, mockPolicyReport.scope.kind);

    expect(reports).toEqual([mockPolicyReport]);
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      'kubewarden/updatePolicyReports',
      [mockPolicyReport]
    );
    expect(mockStore.dispatch).toHaveBeenCalledWith('kubewarden/regenerateSummaryMap');
  });

  it('should use cache for subsequent calls within TTL', async() => {
    (mockStore.dispatch as jest.Mock).mockResolvedValueOnce([mockPolicyReport]);
    const firstCall = await policyReporterModule.getReports(mockStore, false);
    const secondCall = await policyReporterModule.getReports(mockStore, false);

    // For the first call, dispatch is invoked for:
    //   - 'cluster/findAll' (if needed) / update action inside processReportsInBatches,
    //   - and 'kubewarden/regenerateSummaryMap'
    // For the second call, the cached promise is used for the report fetch, but regenerateSummaryMap is still dispatched.
    // Therefore, we expect a total of 4 dispatch calls.
    expect((mockStore.dispatch as jest.Mock).mock.calls.length).toBe(4);
    expect(firstCall).toEqual(secondCall);
  });
});

describe('__clearReportCache', () => {
  it('should clear the report cache so that new fetches occur', async() => {
    (mockStore.dispatch as jest.Mock).mockResolvedValueOnce([mockPolicyReport]);
    // First call caches the result.
    await policyReporterModule.getReports(mockStore, false);
    // Clear cache.
    policyReporterModule.__clearReportCache();
    // Second call should trigger dispatch again.
    await policyReporterModule.getReports(mockStore, false);
    // Expect dispatch to have been called again (i.e. more than previous count).
    expect((mockStore.dispatch as jest.Mock).mock.calls.length).toBeGreaterThan(2);
  });
});

describe('generateSummaryMap', () => {
  it('should correctly summarize policy report results', () => {
    // Create a mock report that meets the criteria:
    // - Managed by kubewarden.
    // - Has a scope with namespace and name.
    // - Includes one result marked as FAIL.
    const mockReport = {
      metadata: { labels: { 'app.kubernetes.io/managed-by': 'kubewarden' } },
      scope:    {
        name:      'resource1',
        namespace: 'default'
      },
      results: [{ result: 'FAIL' }]
    };

    const storeState = {
      clusterPolicyReports: [mockReport],
      policyReports:        []
    };

    const summary = policyReporterModule.generateSummaryMap(storeState);

    expect(summary).toEqual({
      'default/resource1': {
        pass:  0,
        fail:  1,
        warn:  0,
        error: 0,
        skip:  0
      }
    });
  });
});

describe('getFilteredReport', () => {
  it('should return null if schema is falsy', async() => {
    mockStore.getters['cluster/schemaFor'].mockReturnValueOnce(false);
    const report = await policyReporterModule.getFilteredReport(mockStore, {
      id:   'abc',
      type: 'mock'
    });

    expect(report).toBeNull();
  });

  it('should return null if no reports are fetched', async() => {
    mockStore.getters['cluster/schemaFor'].mockReturnValue(true);
    // Simulate getReports returning an empty array.
    (mockStore.dispatch as jest.Mock).mockResolvedValueOnce([]);
    const report = await policyReporterModule.getFilteredReport(mockStore, {
      id:       'abc',
      type:     'mock',
      metadata: { namespace: 'default' }
    });

    expect(report).toBeNull();
  });

  it('should return a filtered report if found in store getters', async() => {
    mockStore.getters['cluster/schemaFor'].mockReturnValue(true);
    (mockStore.dispatch as jest.Mock).mockResolvedValueOnce([mockPolicyReport]);
    // Simulate that reportByResourceId returns a report.
    mockStore.getters['kubewarden/reportByResourceId'].mockReturnValueOnce(mockPolicyReport);
    const report = await policyReporterModule.getFilteredReport(mockStore, {
      id:       'abc',
      type:     'mock',
      metadata: { namespace: 'default' }
    });

    expect(report).toEqual(mockPolicyReport);
  });

  it('should return null if an error occurs during fetching', async() => {
    mockStore.getters['cluster/schemaFor'].mockReturnValue(true);
    // (mockStore.dispatch as jest.Mock).mockRejectedValueOnce(new Error('Test error'));
    const report = await policyReporterModule.getFilteredReport(mockStore, {
      id:       'abc',
      type:     'mock',
      metadata: { namespace: 'default' }
    });

    expect(report).toBeNull();
  });
});

describe('getLinkForPolicy', () => {
  it('should return a route for a given cluster-level policy report result', () => {
    // Ensure the schema getter returns true for the cluster admission policy.
    mockStore.getters['cluster/schemaFor'].mockImplementation((type: string) => type === KUBEWARDEN.CLUSTER_ADMISSION_POLICY);

    // For a cluster-level policy report (no namespace provided)
    const report1 = {
      policy:     'clusterwide-example-policy',
      properties: { 'policy-name': 'example-policy' }
    };

    const route1 = policyReporterModule.getLinkForPolicy(mockStore, report1);

    expect(route1).toMatchObject({
      name:   'c-cluster-product-resource-id',
      params: expect.objectContaining({
        id:       'example-policy',
        resource: KUBEWARDEN.CLUSTER_ADMISSION_POLICY
      })
    });
  });

  it('should return a route for a namespaced policy report result', () => {
    // Ensure the schema getter returns true for the namespaced admission policy.
    mockStore.getters['cluster/schemaFor'].mockImplementation((type: string) => type === KUBEWARDEN.ADMISSION_POLICY);

    // For a namespaced policy report
    const report2 = {
      policy:     'namespaced-something-example-policy',
      properties: {
        'policy-name':      'example-policy',
        'policy-namespace': 'something'
      }
    };

    const route2 = policyReporterModule.getLinkForPolicy(mockStore, report2);

    expect(route2).toMatchObject({
      name:   'c-cluster-product-resource-namespace-id',
      params: expect.objectContaining({
        id:        'example-policy',
        resource:  KUBEWARDEN.ADMISSION_POLICY,
        namespace: 'something'
      })
    });
  });
});

describe('getLinkForResource', () => {
  it('should return undefined if report.scope is empty', () => {
    const report = { scope: {} };
    const route = policyReporterModule.getLinkForResource(report);

    expect(route).toBeUndefined();
  });

  it('should return a namespaced route for a core resource', () => {
    // Simulate a core resource by setting kind to a value that our module will detect.
    const report = {
      scope: {
        kind:      'Pod',
        name:      'mypod',
        namespace: 'myns'
      }
    };
    const route = policyReporterModule.getLinkForResource(report);

    expect(route).toEqual({
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource:  'pod', // kind.toLowerCase()
        id:        'mypod',
        namespace: 'myns'
      }
    });
  });

  it('should return a non-namespaced route for a core resource without a namespace', () => {
    const report = {
      scope: {
        kind: 'Pod',
        name: 'mypod'
      }
    };
    const route = policyReporterModule.getLinkForResource(report);

    expect(route).toEqual({
      name:   'c-cluster-product-resource-id',
      params: {
        resource: 'pod',
        id:       'mypod'
      }
    });
  });
});

describe('colorForResult', () => {
  it('should return "text-error" for FAIL', () => {
    expect(policyReporterModule.colorForResult(Result.FAIL)).toBe('text-error');
  });
  it('should return "sizzle-warning" for ERROR', () => {
    expect(policyReporterModule.colorForResult(Result.ERROR)).toBe('sizzle-warning');
  });
  it('should return "text-success" for PASS', () => {
    expect(policyReporterModule.colorForResult(Result.PASS)).toBe('text-success');
  });
  it('should return "text-warning" for WARN', () => {
    expect(policyReporterModule.colorForResult(Result.WARN)).toBe('text-warning');
  });
  it('should return "text-darker" for SKIP', () => {
    expect(policyReporterModule.colorForResult(Result.SKIP)).toBe('text-darker');
  });
  it('should return "text-muted" for an unknown result', () => {
    expect(policyReporterModule.colorForResult('unknown' as Result)).toBe('text-muted');
  });
});

describe('colorForSeverity', () => {
  it('should return "bg-info" for INFO', () => {
    expect(policyReporterModule.colorForSeverity(Severity.INFO)).toBe('bg-info');
  });
  it('should return "bg-warning" for LOW', () => {
    expect(policyReporterModule.colorForSeverity(Severity.LOW)).toBe('bg-warning');
  });
  it('should return "bg-warning" for MEDIUM', () => {
    expect(policyReporterModule.colorForSeverity(Severity.MEDIUM)).toBe('bg-warning');
  });
  it('should return "bg-warning" for HIGH', () => {
    expect(policyReporterModule.colorForSeverity(Severity.HIGH)).toBe('bg-warning');
  });
  it('should return "bg-critical" for CRITICAL', () => {
    expect(policyReporterModule.colorForSeverity(Severity.CRITICAL)).toBe('bg-critical');
  });
  it('should return "bg-muted" for an unknown severity', () => {
    expect(policyReporterModule.colorForSeverity('unknown' as Severity)).toBe('bg-muted');
  });
});

describe('newPolicyReportCompatible', () => {
  it('should be compatible with OLD data structure for controllerAppVersion >= 1.10.0 and UI plugin version >= 1.4.0', () => {
    const result = policyReporterModule.newPolicyReportCompatible('1.10.0', '1.4.0');

    expect(result).toStrictEqual({
      oldPolicyReports: false,
      newPolicyReports: true
    });
  });

  it('should be incompatible with NEW data structure for controllerAppVersion >= 1.11.0 and UI plugin version >= 1.3.6', () => {
    const result = policyReporterModule.newPolicyReportCompatible('1.11.0', '1.3.6');

    expect(result).toStrictEqual({
      oldPolicyReports: true,
      newPolicyReports: false
    });
  });
});
