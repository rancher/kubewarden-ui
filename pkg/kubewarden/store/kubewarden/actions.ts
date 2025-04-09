import {
  CatalogApp,
  CustomResourceDefinition,
  PolicyReport,
  ClusterPolicyReport,
  PolicyTraceConfig,
  PolicyTrace,
  // REGO_POLICIES_REPO,
  // ArtifactHubPackage,
  // ArtifactHubPackageDetails,
  PolicyReportSummary
} from '@kubewarden/types';
import { generateSummaryMap } from '@kubewarden/modules/policyReporter';

// const PACKAGES_TTL = 5 * 60 * 1000; // 5 minutes

export default {
  updateAirGapped({ commit }: any, val: boolean) {
    commit('updateAirGapped', val);
  },

  // Defaults banner
  updateHideBannerDefaults({ commit }: any, val: boolean) {
    commit('updateHideBannerDefaults', val);
  },

  // Official Repo banner
  updateHideBannerOfficialRepo({ commit }: any, val: boolean) {
    commit('updateHideBannerOfficialRepo', val);
  },

  // Policy Repo banner
  updateHideBannerPolicyRepo({ commit }: any, val: boolean) {
    commit('updateHideBannerPolicyRepo', val);
  },

  // Airgap Policy banner
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

  // /**
  //  * Fetch all packages from ArtifactHub and store them in Vuex.
  //  *
  //  * @param {Object} context - Vuex context
  //  * @param {Object} options - The object containing:
  //  *   - value: The CR resource with artifactHubRepo() and artifactHubPackage() methods
  //  *   - force: Boolean to force a fetch, ignoring TTL (default: false)
  //  */
  // async fetchPackages({ state, commit, dispatch }: any, { value, force = false }: any) {
  //   const now = Date.now();
  //   const isCacheValid = state.packageCacheTime && (now - state.packageCacheTime < PACKAGES_TTL);

  //   // If not forcing a refresh and the cache is still valid, skip the fetch
  //   if (!force && isCacheValid) {
  //     return;
  //   }

  //   try {
  //     commit('updateLoadingPackages', true);

  //     // -- 1) Fetch all pages in increments of 60 using limit/offset --
  //     const limit = 60;
  //     let offset = 0;
  //     let hasMore = true;
  //     let allPackages: ArtifactHubPackage[] = [];

  //     while (hasMore) {
  //       const fetched: { packages: ArtifactHubPackage[] } = await value.artifactHubRepo({
  //         offset,
  //         limit
  //       });

  //       const { packages } = fetched;

  //       if (Array.isArray(packages) && packages.length > 0) {
  //         allPackages = allPackages.concat(packages);

  //         // If it's less than 60, we’re done
  //         if (packages.length < limit) {
  //           hasMore = false;
  //         } else {
  //           offset += limit; // Move on to the next batch
  //         }
  //       } else {
  //         hasMore = false;
  //       }
  //     }

  //     // If we somehow got no packages, just return
  //     if (!allPackages.length) {
  //       return;
  //     }

  //     // -- 2) Filter out Rego-based packages --
  //     const packagesByRepo = allPackages.filter(
  //       (pkg) => !pkg?.repository?.url?.includes(REGO_POLICIES_REPO)
  //     );

  //     // -- 3) Fetch full details for each package and build a map --
  //     const packageDetailsMap: Record<string, ArtifactHubPackageDetails> = {};

  //     const results = await Promise.all(
  //       packagesByRepo.map(async(pkg) => {
  //         const details = await dispatch('fetchPackageDetails', {
  //           pkg,
  //           value
  //         });

  //         packageDetailsMap[pkg.package_id] = details;

  //         return details;
  //       })
  //     );

  //     // Filter out any hidden UI packages
  //     const filtered = results.filter((pkg) => pkg?.data?.['kubewarden/hidden-ui'] !== 'true');

  //     // -- 4) Commit to store --
  //     commit('updatePackages', filtered);
  //     commit('updatePackageDetails', packageDetailsMap);
  //     commit('updatePackageCacheTime', Date.now());
  //   } catch (err) {
  //     console.warn('Error fetching packages', err);
  //   } finally {
  //     commit('updateLoadingPackages', false);
  //   }
  // },

  // /**
  //    * Fetch details for a single package.
  //    */
  // async fetchPackageDetails(context: any, { pkg, value }: any) {
  //   try {
  //     return await value.artifactHubPackage(pkg);
  //   } catch (err) {
  //     console.warn('Error fetching package details:', err);

  //     return null;
  //   }
  // },
};
