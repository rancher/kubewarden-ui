import * as policyReporterModule from '@kubewarden/modules/policyReporter.ts';
import { KUBEWARDEN } from '@kubewarden/types';
import { mockPolicyReport, mockClusterPolicyReport } from '../_templates_/policyReports';
import { mockControllerApp } from '../_templates_/controllerApp';

jest.mock('lodash/isEmpty', () => ({
  __esModule: true,
  default:    jest.fn().mockImplementation(data => data.length === 0),
}));

jest.mock('@shell/utils/string', () => ({ randomStr: jest.fn().mockReturnValue('randomString') }));

const mockStore = {
  getters: {
    'cluster/schemaFor':               jest.fn(),
    'kubewarden/policyReports':        [mockPolicyReport],
    'kubewarden/clusterPolicyReports': [mockClusterPolicyReport],
    'kubewarden/controllerApp':        mockControllerApp
  },
  dispatch: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.getters['cluster/schemaFor'].mockReturnValue(true);
});

describe('getReports', () => {
  it('should fetch and dispatch cluster policy reports when cluster level is true', async() => {
    // Setting up the store to return a cluster policy report
    mockStore.dispatch.mockResolvedValue([mockClusterPolicyReport]);
    const reports = await policyReporterModule.getReports(mockStore, true);

    expect(reports).toEqual([mockClusterPolicyReport]);
    expect(mockStore.dispatch).toHaveBeenCalledWith('kubewarden/updateClusterPolicyReports', mockClusterPolicyReport);
  });

  it('should fetch and dispatch policy reports when cluster level is false', async() => {
    // Setting up the store to return a regular policy report
    mockStore.dispatch.mockResolvedValue([mockPolicyReport]);
    const reports = await policyReporterModule.getReports(mockStore, false);

    expect(reports).toEqual([mockPolicyReport]);
    expect(mockStore.dispatch).toHaveBeenCalledWith('kubewarden/updatePolicyReports', mockPolicyReport);
  });

  it('should fetch and dispatch policy reports when cluster level is false and resourceType is specified', async() => {
    // Setting up the store to return a regular policy report
    mockStore.dispatch.mockResolvedValue([mockPolicyReport]);
    const reports = await policyReporterModule.getReports(mockStore, false, 'test.resource');

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

describe('newPolicyReportCompatible', () => {
  it('should be incompatible with OLD data structure for a controller app version >= 1.10.0 && UI plugin version >= 1.4.0', () => {
    const result = policyReporterModule.newPolicyReportCompatible('1.10.0', '1.4.0');

    expect(result).toStrictEqual({
      oldPolicyReports: false,
      newPolicyReports:  true
    });
  });
  it('should be incompatible with NEW data structure for a controller app version >= 1.11.0 && UI plugin version >= 1.3.6', () => {
    const result = policyReporterModule.newPolicyReportCompatible('1.11.0', '1.3.6');

    expect(result).toStrictEqual({
      oldPolicyReports: true,
      newPolicyReports:  false
    });
  });
});