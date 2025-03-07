import {
  CatalogApp,
  CustomResourceDefinition,
  PolicyReport,
  ClusterPolicyReport,
  PolicyTraceConfig,
  PolicyTrace,
  REGO_POLICIES_REPO,
  ArtifactHubPackage,
  ArtifactHubPackageDetails, PolicyReportSummary
} from '@kubewarden/types';
import { generateSummaryMap } from '@kubewarden/modules/policyReporter';

const PACKAGES_TTL = 5 * 60 * 1000; // 5 minutes

export default {
  updateAirGapped({ commit }: any, val: boolean) {
    commit('updateAirGapped', val);
  },

  // Defaults banner
  updateHideBannerDefaults({ commit }: any, val: boolean) {
    commit('updateHideBannerDefaults', val);
  },

  // ArtifactHub banner
  updateHideBannerArtifactHub({ commit }: any, val: boolean) {
    commit('updateHideBannerArtifactHub', val);
  },
  updateHideBannerAirgapPolicy({ commit }: any, val: boolean) {
    commit('updateHideBannerAirgapPolicy', val);
  },

  // Policy and Cluster Policy Reports
  updateLoadingReports({ commit }: any, val: boolean) {
    commit('updateLoadingReports', val);
  },

  updatePolicyReports({ commit }: any, updatedReports: PolicyReport[]) {
    commit('updateReportsBatch', {
      reportArrayKey: 'policyReports',
      updatedReports
    });
  },
  updateClusterPolicyReports({ commit }: any, updatedReports: ClusterPolicyReport[]) {
    commit('updateReportsBatch', {
      reportArrayKey: 'clusterPolicyReports',
      updatedReports
    });
  },

  async regenerateSummaryMap({ state, commit }: any) {
    const newSummary: Record<string, PolicyReportSummary> = generateSummaryMap(state);

    commit('setSummaryMap', newSummary);
  },

  // Policy traces
  updatePolicyTraces({ commit }: any, val: { policyName: string, updatedTrace: PolicyTrace }) {
    commit('updatePolicyTraces', val);
  },
  removePolicyTraceById({ commit }: any, policy: PolicyTraceConfig, trace: PolicyTrace) {
    commit('removePolicyTraceById', policy, trace);
  },

  // Charts
  updateRefreshingCharts({ commit }: any, val: boolean) {
    commit('updateRefreshingCharts', val);
  },

  // Catalog
  updateControllerApp({ commit }: any, val: CatalogApp) {
    commit('updateControllerApp', val);
  },
  removeControllerApp({ commit }: any, val: CatalogApp) {
    commit('removeControllerApp', val);
  },
  updateKubewardenCrds({ commit }: any, val: CustomResourceDefinition) {
    commit('updateKubewardenCrds', val);
  },
  removeKubewardenCrds({ commit }: any, val: CustomResourceDefinition) {
    commit('removeKubewardenCrds', val);
  },

  /**
   * Fetch all packages from the provided repository and store them in Vuex.
   *
   * @param {Object} param0 The Vuex context
   * @param {Object} param1 The object containing:
   *   - repository: The repository object returned by `value.artifactHubRepo()`
   *   - value: The CR resource containing the method to fetch package details (artifactHubPackage)
   *   - force: Boolean to force a fetch regardless of TTL (default: false)
   */
  async fetchPackages({ state, commit, dispatch }: any, { repository, value, force = false }: any) {
    try {
      // Check if we have a packageCacheTime, and if TTL is still valid
      const now = Date.now();
      const isCacheValid = state.packageCacheTime && (now - state.packageCacheTime < PACKAGES_TTL);

      // If not forcing a refresh and the cache is still valid, return immediately
      if (!force && isCacheValid) {
        return;
      }

      if (!repository?.packages?.length) {
        return;
      }

      commit('updateLoadingPackages', true);

      // Filter out Rego-based packages
      const packagesByRepo: ArtifactHubPackage[] = repository.packages.filter(
        (pkg: ArtifactHubPackage) => !pkg?.repository?.url?.includes(REGO_POLICIES_REPO)
      );

      // Store all package details keyed by package_id
      const packageDetailsMap: Record<string, ArtifactHubPackageDetails> = {};

      const results = await Promise.all(
        packagesByRepo.map(async(pkg) => {
          const details = await dispatch('fetchPackageDetails', {
            pkg,
            value
          });
          const key: string = pkg.package_id;

          packageDetailsMap[key] = details;

          return details;
        })
      );

      // Filter out any hidden UI packages
      const filtered = results.filter((pkg) => pkg?.data?.['kubewarden/hidden-ui'] !== 'true');

      commit('updatePackages', filtered);
      commit('updatePackageDetails', packageDetailsMap);
      commit('updatePackageCacheTime', Date.now());
    } catch (err) {
      console.warn('Error fetching packages', err);
    } finally {
      commit('updateLoadingPackages', false);
    }
  },

  /**
     * Fetch details for a single package.
     */
  async fetchPackageDetails(context: any, { pkg, value }: any) {
    try {
      return await value.artifactHubPackage(pkg);
    } catch (err) {
      console.warn('Error fetching package details:', err);

      return null;
    }
  },
};
