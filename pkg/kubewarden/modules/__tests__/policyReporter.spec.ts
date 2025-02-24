import { Store } from 'vuex';

import * as policyReporterModule from '@kubewarden/modules/policyReporter';
import { KUBEWARDEN } from '@kubewarden/types';
import { mockPolicyReport, mockClusterPolicyReport } from '@tests/unit/mocks/policyReports';
import { mockControllerApp } from '@tests/unit/mocks/controllerApp';

jest.mock('lodash/isEmpty', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((data) => {
    if (Array.isArray(data)) {
      return data.length === 0;
    }
    return Object.keys(data || {}).length === 0;
  }),
}));

jest.mock('@shell/utils/string', () => ({
  randomStr: jest.fn().mockReturnValue('randomString')
}));

// Create a mock store that now includes additional getters used by the module
const mockStore = {
  getters: {
    'cluster/schemaFor': jest.fn(),
    'cluster/all': jest.fn(),
    'kubewarden/reportByResourceId': jest.fn(),
    'kubewarden/policyReports': [mockPolicyReport],
    'kubewarden/clusterPolicyReports': [mockClusterPolicyReport],
    'kubewarden/controllerApp': mockControllerApp
  },
  dispatch: jest.fn()
}  as unknown as Store<any>;

beforeEach(() => {
  jest.clearAllMocks();

  // Clear the report cache so each test runs fresh.
  policyReporterModule.__clearReportCache();

  // Return a dummy schema for any type
  mockStore.getters['cluster/schemaFor'].mockReturnValue(true);

  // Assume no reports are cached by default so that findAll is triggered
  mockStore.getters['cluster/all'].mockReturnValue([]);

  // Default: no report is found by resource ID
  mockStore.getters['kubewarden/reportByResourceId'].mockReturnValue(null);

  // Polyfill requestIdleCallback for test environment if missing
  global.requestIdleCallback = (cb) => setTimeout(cb, 0);
});

describe('getReports', () => {
  it('should fetch and dispatch cluster policy reports when cluster level is true', async () => {
    (mockStore.dispatch as jest.Mock).mockResolvedValueOnce([mockClusterPolicyReport]);

    const reports = await policyReporterModule.getReports(mockStore, true);

    expect(reports).toEqual([mockClusterPolicyReport]);
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      'kubewarden/updateClusterPolicyReports',
      [mockClusterPolicyReport]
    );
    expect(mockStore.dispatch).toHaveBeenCalledWith('kubewarden/regenerateSummaryMap');
  });

  it('should fetch and dispatch policy reports when cluster level is false', async () => {
    (mockStore.dispatch as jest.Mock).mockResolvedValueOnce([mockPolicyReport]);

    const reports = await policyReporterModule.getReports(mockStore, false);

    expect(reports).toEqual([mockPolicyReport]);
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      'kubewarden/updatePolicyReports',
      [mockPolicyReport]
    );
    expect(mockStore.dispatch).toHaveBeenCalledWith('kubewarden/regenerateSummaryMap');
  });

  it('should fetch and dispatch policy reports when cluster level is false and resourceType is specified', async () => {
    (mockStore.dispatch as jest.Mock).mockResolvedValueOnce([mockPolicyReport]);

    const reports = await policyReporterModule.getReports(mockStore, false, mockPolicyReport.scope.kind);

    expect(reports).toEqual([mockPolicyReport]);
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      'kubewarden/updatePolicyReports',
      [mockPolicyReport]
    );
    expect(mockStore.dispatch).toHaveBeenCalledWith('kubewarden/regenerateSummaryMap');
  });
});

describe('generateSummaryMap', () => {
  it('should correctly summarize policy report results', () => {
    // Create a mock report that meets the criteria:
    // - It is managed by kubewarden.
    // - It has a scope with namespace and name.
    // - It includes one result marked as FAIL.
    const mockReport = {
      metadata: {
        labels: {
          'app.kubernetes.io/managed-by': 'kubewarden'
        }
      },
      scope: {
        name: 'resource1',
        namespace: 'default'
      },
      results: [
        { result: 'FAIL' }
      ]
    };

    const storeState = {
      clusterPolicyReports: [mockReport],
      policyReports: []
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

describe('getLinkForPolicy', () => {
  it('should return a route for a given policy report result', () => {
    // Ensure the schema getter returns true for both types.
    mockStore.getters['cluster/schemaFor'].mockImplementation((type: string) =>
      type === KUBEWARDEN.CLUSTER_ADMISSION_POLICY || type === KUBEWARDEN.ADMISSION_POLICY
    );

    // For a cluster-level policy report (no namespace provided in properties)
    const report1 = {
      policy: 'clusterwide-example-policy',
      properties: { 'policy-name': 'example-policy' }
    };

    const route1 = policyReporterModule.getLinkForPolicy(mockStore, report1);
    expect(route1).toMatchObject({
      name: 'c-cluster-product-resource-id',
      params: expect.objectContaining({
        id: 'example-policy',
        resource: KUBEWARDEN.CLUSTER_ADMISSION_POLICY
      })
    });

    // For a namespaced policy report
    const report2 = {
      policy: 'namespaced-something-example-policy',
      properties: { 'policy-name': 'example-policy', 'policy-namespace': 'something' }
    };

    const route2 = policyReporterModule.getLinkForPolicy(mockStore, report2);
    expect(route2).toMatchObject({
      name: 'c-cluster-product-resource-namespace-id',
      params: expect.objectContaining({
        id: 'example-policy',
        resource: KUBEWARDEN.ADMISSION_POLICY,
        namespace: 'something'
      })
    });
  });
});

describe('newPolicyReportCompatible', () => {
  it('should be incompatible with OLD data structure for a controller app version >= 1.10.0 && UI plugin version >= 1.4.0', () => {
    const result = policyReporterModule.newPolicyReportCompatible('1.10.0', '1.4.0');

    expect(result).toStrictEqual({
      oldPolicyReports: false,
      newPolicyReports: true
    });
  });

  it('should be incompatible with NEW data structure for a controller app version >= 1.11.0 && UI plugin version >= 1.3.6', () => {
    const result = policyReporterModule.newPolicyReportCompatible('1.11.0', '1.3.6');

    expect(result).toStrictEqual({
      oldPolicyReports: true,
      newPolicyReports: false
    });
  });
});
