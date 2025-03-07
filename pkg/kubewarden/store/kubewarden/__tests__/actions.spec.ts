import { REGO_POLICIES_REPO } from '@kubewarden/types';

import actions from '@kubewarden/store/kubewarden/actions';
import { generateSummaryMap } from '@kubewarden/modules/policyReporter';

jest.mock('@kubewarden/modules/policyReporter', () => ({ generateSummaryMap: jest.fn(() => ({ summary: 'testSummary' })) }));

describe('Vuex Actions', () => {
  let commit;
  let dispatch;
  let state;

  beforeEach(() => {
    commit = jest.fn();
    dispatch = jest.fn();
    state = {
      packageCacheTime: null,
      packages:         [],
      packageDetails:   {},
    };
  });

  it('updateAirGapped should commit "updateAirGapped" with the provided value', () => {
    actions.updateAirGapped({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateAirGapped', true);
  });

  it('updateHideBannerDefaults should commit "updateHideBannerDefaults" with the provided value', () => {
    actions.updateHideBannerDefaults({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateHideBannerDefaults', true);
  });

  it('updateHideBannerArtifactHub should commit "updateHideBannerArtifactHub" with the provided value', () => {
    actions.updateHideBannerArtifactHub({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateHideBannerArtifactHub', true);
  });

  it('updateHideBannerAirgapPolicy should commit "updateHideBannerAirgapPolicy" with the provided value', () => {
    actions.updateHideBannerAirgapPolicy({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateHideBannerAirgapPolicy', true);
  });

  it('updateLoadingReports should commit "updateLoadingReports" with the provided value', () => {
    actions.updateLoadingReports({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateLoadingReports', true);
  });

  it('updatePolicyReports should commit "updateReportsBatch" with reportArrayKey "policyReports"', () => {
    const reports = [{
      id:      '1',
      results: []
    }];

    actions.updatePolicyReports({ commit }, reports);
    expect(commit).toHaveBeenCalledWith('updateReportsBatch', {
      reportArrayKey: 'policyReports',
      updatedReports: reports
    });
  });

  it('updateClusterPolicyReports should commit "updateReportsBatch" with reportArrayKey "clusterPolicyReports"', () => {
    const reports = [{
      id:      '2',
      results: []
    }];

    actions.updateClusterPolicyReports({ commit }, reports);
    expect(commit).toHaveBeenCalledWith('updateReportsBatch', {
      reportArrayKey: 'clusterPolicyReports',
      updatedReports: reports
    });
  });

  describe('fetchPackages', () => {
    const PACKAGES_TTL = 5 * 60 * 1000; // or whatever you use

    it('should not fetch if cache is still valid and force is false', async() => {
      // Make the cache still valid
      state.packageCacheTime = Date.now();
      // The difference between now and packageCacheTime is < PACKAGES_TTL, so it’s valid

      await actions.fetchPackages({
        state,
        commit,
        dispatch
      }, {
        value: {},
        force: false
      });

      // Expect NO commits that indicate we fetched anything
      expect(commit).not.toHaveBeenCalledWith('updatePackages', expect.anything());
      expect(commit).not.toHaveBeenCalledWith('updatePackageDetails', expect.anything());
    });

    it('should fetch multiple pages if cache is invalid, then commit results', async() => {
      // Make the cache too old (invalid)
      state.packageCacheTime = Date.now() - (PACKAGES_TTL + 10000);

      const mockValue = {
        artifactHubRepo: jest.fn()
          .mockResolvedValueOnce({
            packages: Array.from({ length: 60 }, (_, i) => ({
              package_id: `pkg-${ i }`,
              name:       `packageName-${ i }`,
              repository: { url: 'https://some-other-repo.com' },
            }))
          })
          .mockResolvedValueOnce({
            packages: Array.from({ length: 30 }, (_, i) => ({
              package_id: `pkg-${ i + 60 }`,
              name:       `packageName-${ i + 60 }`,
              repository: { url: 'https://some-other-repo.com' },
            }))
          }),
        artifactHubPackage: jest.fn((packageId) => {
          return Promise.resolve({
            data:       {},
            package_id: packageId,
          });
        })
      };

      // Mock dispatch for fetching package details
      dispatch.mockImplementation((actionName, payload) => {
        if (actionName === 'fetchPackageDetails') {
          return mockValue.artifactHubPackage(payload.pkg.package_id);
        }
      });

      await actions.fetchPackages({
        state,
        commit,
        dispatch
      }, {
        value: mockValue,
        force: false
      });

      // Expect artifactHubRepo to have been called twice:
      expect(mockValue.artifactHubRepo).toHaveBeenCalledTimes(2);
      expect(mockValue.artifactHubRepo).toHaveBeenNthCalledWith(1, {
        offset: 0,
        limit:  60
      });
      expect(mockValue.artifactHubRepo).toHaveBeenNthCalledWith(2, {
        offset: 60,
        limit:  60
      });

      // Confirm that at least one call to fetchPackageDetails was made.
      expect(dispatch).toHaveBeenCalledWith('fetchPackageDetails', expect.objectContaining({ pkg: expect.objectContaining({ package_id: 'pkg-0' }) }));

      // Confirm that final commits were made
      expect(commit).toHaveBeenCalledWith('updatePackages', expect.any(Array));
      expect(commit).toHaveBeenCalledWith('updatePackageDetails', expect.any(Object));
      expect(commit).toHaveBeenCalledWith('updatePackageCacheTime', expect.any(Number));
    });

    it('should filter out Rego-based packages and hidden UI packages', async() => {
      const mockValue = {
        artifactHubRepo: jest.fn().mockResolvedValueOnce({
          packages: [
            // Rego-based package (to be filtered out immediately)
            {
              package_id: 'rego-1',
              repository: { url: REGO_POLICIES_REPO }
            },
            // Hidden UI package (will be filtered out after details fetch)
            {
              package_id: 'hidden-1',
              repository: { url: 'https://some-other.example.com' }
            },
            // Normal package (should remain)
            {
              package_id: 'normal-1',
              repository: { url: 'https://some-other.example.com' }
            }
          ]
        }),
        artifactHubPackage: jest.fn((packageId) => {
          if (packageId === 'hidden-1') {
            return Promise.resolve({
              data:       { 'kubewarden/hidden-ui': 'true' },
              package_id: packageId
            });
          }

          return Promise.resolve({
            data:       {},
            package_id: packageId
          });
        })
      };

      dispatch.mockImplementation((actionName, payload) => {
        if (actionName === 'fetchPackageDetails') {
          return mockValue.artifactHubPackage(payload.pkg.package_id);
        }
      });

      await actions.fetchPackages({
        state,
        commit,
        dispatch
      }, {
        value: mockValue,
        force: true
      });

      // The final commit should only include the normal package.
      expect(commit).toHaveBeenCalledWith('updatePackages', [
        expect.objectContaining({ package_id: 'normal-1' })
      ]);

      // We expect that fetchPackageDetails is called only for hidden-1 and normal-1,
      // since Rego-based packages are filtered out before that.
      expect(mockValue.artifactHubPackage).toHaveBeenCalledTimes(2);
    });
  });

  it('regenerateSummaryMap should call generateSummaryMap and commit "setSummaryMap"', async() => {
    const context = {
      state,
      commit
    };

    await actions.regenerateSummaryMap(context);
    expect(generateSummaryMap).toHaveBeenCalledWith(state);
    expect(commit).toHaveBeenCalledWith('setSummaryMap', { summary: 'testSummary' });
  });

  it('updatePolicyTraces should commit "updatePolicyTraces" with the given payload', () => {
    const payload = {
      policyName:   'testPolicy',
      cluster:      'testCluster',
      updatedTrace: { id: 'trace1' }
    };

    actions.updatePolicyTraces({ commit }, payload);
    expect(commit).toHaveBeenCalledWith('updatePolicyTraces', payload);
  });

  it('removePolicyTraceById should commit "removePolicyTraceById" with provided policy and trace', () => {
    const policy = { policyName: 'testPolicy' };
    const trace = { id: 'trace1' };

    actions.removePolicyTraceById({ commit }, policy, trace);
    expect(commit).toHaveBeenCalledWith('removePolicyTraceById', policy, trace);
  });

  it('updateRefreshingCharts should commit "updateRefreshingCharts" with the provided value', () => {
    actions.updateRefreshingCharts({ commit }, true);
    expect(commit).toHaveBeenCalledWith('updateRefreshingCharts', true);
  });

  it('updateControllerApp should commit "updateControllerApp" with the provided value', () => {
    const app = {
      id:       'app1',
      metadata: {},
      spec:     {},
      status:   {}
    };

    actions.updateControllerApp({ commit }, app);
    expect(commit).toHaveBeenCalledWith('updateControllerApp', app);
  });

  it('removeControllerApp should commit "removeControllerApp" with the provided value', () => {
    const app = {
      id:       'app1',
      metadata: {},
      spec:     {},
      status:   {}
    };

    actions.removeControllerApp({ commit }, app);
    expect(commit).toHaveBeenCalledWith('removeControllerApp', app);
  });

  it('updateKubewardenCrds should commit "updateKubewardenCrds" with the provided value', () => {
    const crd = {
      metadata: { name: 'crd1' },
      spec:     {},
      status:   {}
    };

    actions.updateKubewardenCrds({ commit }, crd);
    expect(commit).toHaveBeenCalledWith('updateKubewardenCrds', crd);
  });

  it('removeKubewardenCrds should commit "removeKubewardenCrds" with the provided value', () => {
    const crd = {
      metadata: { name: 'crd1' },
      spec:     {},
      status:   {}
    };

    actions.removeKubewardenCrds({ commit }, crd);
    expect(commit).toHaveBeenCalledWith('removeKubewardenCrds', crd);
  });
});
