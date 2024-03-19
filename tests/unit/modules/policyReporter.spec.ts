import * as policyReporterModule from '@kubewarden/modules/policyReporter.ts';
import { KUBEWARDEN } from '@kubewarden/types';
import { mockPolicyReport } from '../_templates_/policyReports';

// Mocking lodash's isEmpty function//
jest.mock('lodash/isEmpty', () => ({
  __esModule: true,
  default:    jest.fn().mockImplementation(data => data.length === 0),
}));

// Mocking @shell/utils/string randomStr function
jest.mock('@shell/utils/string', () => ({ randomStr: jest.fn().mockReturnValue('randomString') }));

const mockStore = {
  getters: {
    'cluster/schemaFor':        jest.fn(),
    'kubewarden/policyReports': [mockPolicyReport],
  },
  dispatch: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.getters['cluster/schemaFor'].mockReturnValue(true);
});

describe('getPolicyReports', () => {
  it('should fetch policy reports and update the store', async() => {
    mockStore.dispatch.mockResolvedValue([mockPolicyReport]); // Simulate fetching policy reports successfully

    const reports = await policyReporterModule.getPolicyReports(mockStore);

    expect(reports).toEqual([mockPolicyReport]);
    expect(mockStore.dispatch).toHaveBeenCalledWith('kubewarden/updatePolicyReports', mockPolicyReport);
  });
});

describe('getFilteredSummary', () => {
  it('should correctly summarize policy report results', () => {
    const resource = { type: 'pod', metadata: { name: 'mock-pod', uid: 'mock-pod-uid' } };
    const summary = policyReporterModule.getFilteredSummary(mockStore, resource);

    expect(summary).toEqual({
      pass:  0,
      fail:  1,
      warn:  0,
      error: 0,
      skip:  0,
    });
  });
});

describe('getLinkForPolicy', () => {
  it('should return a route for a given policy report result', () => {
    mockStore.getters['cluster/schemaFor'].mockImplementation((type) => {
      return type === KUBEWARDEN.CLUSTER_ADMISSION_POLICY || type === KUBEWARDEN.ADMISSION_POLICY;
    });

    const report1 = { policy: 'clusterwide-example-policy', policyName: 'example-policy' };
    const route1 = policyReporterModule.getLinkForPolicy(mockStore, report1);

    expect(route1).toMatchObject({
      name:   expect.any(String),
      params: expect.objectContaining({ id: 'example-policy', resource: 'policies.kubewarden.io.clusteradmissionpolicy' })
    });

    const report2 = {
      policy: 'namespaced-something-example-policy', policyName: 'example-policy', properties: { 'policy-namespace': 'something' }
    };
    const route2 = policyReporterModule.getLinkForPolicy(mockStore, report2);

    expect(route2).toMatchObject({
      name:   expect.any(String),
      params: expect.objectContaining({
        id: 'example-policy', resource: 'policies.kubewarden.io.admissionpolicy', namespace: 'something'
      })
    });
  });
});