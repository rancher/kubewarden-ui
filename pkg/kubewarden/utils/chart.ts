import { Store } from 'vuex';
import semver from 'semver';

import { SHOW_PRE_RELEASE } from '@shell/store/prefs';

import { CatalogApp, Chart, Version } from '../types';
import { handleGrowl } from './handle-growl';

export interface RefreshConfig {
  store: Store<any>;
  chartName: string;
  retry?: number;
  init?: boolean;
}

export interface ReloadReady {
  reloadReady: boolean
}

/**
 * Asynchronously refreshes charts by dispatching actions to the store. It attempts to
 * find a specific chart by its name and, if not found, dispatches actions to refresh
 * the chart catalog. This method will retry the operation up to a maximum of three times
 * based on the retry parameter and the presence of the chart.
 *
 * @param {RefreshConfig} config - The configuration object for the refresh operation.
 * @param {any} config.store - The Vuex store instance used for state management.
 * @param {string} config.chartName - The name of the chart to be refreshed.
 * @param {number} [config.retry=0] - The current retry attempt count. Defaults to 0.
 * @param {boolean} [config.init=false] - A flag indicating whether the initial load
 *        should prevent retries. Defaults to false.
 *
 * @returns {Promise<ReloadReady>} An object indicating whether the reload is ready.
 *          Currently, it always returns an object with `reloadReady` set to false.
 *
 * @example
 * // Example usage:
 * refreshCharts({
 *   store: myStore,
 *   chartName: 'myChart',
 *   retry: 0,
 *   init: true
 * }).then(result => {
 *   console.log(result.reloadReady); // false
 * });
 */
export async function refreshCharts(config: RefreshConfig): Promise<ReloadReady> {
  const { store, chartName, init } = config;
  let retry = config.retry ?? 0;

  while ( retry < 3 ) {
    const rawCharts = store.getters['catalog/rawCharts'];
    const chart = (Object.values(rawCharts) as Chart[])?.find(c => c?.chartName === chartName);

    if ( !chart ) {
      try {
        store.dispatch('kubewarden/updateRefreshingCharts', true);
        await store.dispatch('catalog/refresh');
      } catch (e) {
        handleGrowl({ error: e as any, store });
      } finally {
        store.dispatch('kubewarden/updateRefreshingCharts', false);
      }

      if ( retry < 2 && !init ) {
        retry++;
        continue;
      }
    }
    break;
  }

  return { reloadReady: false };
}

/**
 * Checks if the installed app version satisfies the given constraint.
 *
 * @param store - The Vuex store instance.
 * @param installedAppVersion - The version of the installed application.
 * @param targetAppVersion - The target application version to compare against.
 * @param constraint - The semantic versioning constraint.
 * @returns boolean - True if the installed version satisfies the constraint, otherwise false.
 */
export function appVersionSatisfiesConstraint(
  store: Store<any>,
  installedAppVersion: string,
  targetAppVersion?: string,
  constraint?: string
): boolean {
  if ( installedAppVersion ) {
    if ( targetAppVersion ) {
      const showPreRelease = store.getters['prefs/get'](SHOW_PRE_RELEASE);
      const versionRange = `${ constraint }${ targetAppVersion }`;

      return semver.satisfies(
        installedAppVersion,
        versionRange,
        { includePrerelease: showPreRelease }
      );
    }

    return true;
  }

  return false;
}

/**
 * Checks if there is an upgrade available for the installed application.
 *
 * @param store - The Vuex store instance.
 * @param app - The installed application object.
 * @param chart - The chart object containing version information.
 * @returns Version | null - The highest available upgrade version or null if no upgrade is available.
 */
export function checkUpgradeAvailable(store: Store<any>, app: CatalogApp | null, chart: Chart | null): Version | null {
  if ( app && chart ) {
    const installedAppVersion = app.spec?.chart?.metadata?.appVersion;
    const installedChartVersion = app.spec?.chart?.metadata?.version;
    const chartVersions = chart.versions;

    const showPreRelease = store.getters['prefs/get'](SHOW_PRE_RELEASE);

    if ( installedAppVersion ) {
      const uniqueSortedVersions = Array.from(new Set(chartVersions?.map(v => v.appVersion)))
        .filter(v => showPreRelease ? v : !semver.prerelease(v))
        .sort(semver.compare);

      let highestVersion: string = '';

      for ( const version of uniqueSortedVersions ) {
        const upgradeAvailable = getValidUpgrade(installedAppVersion, version, highestVersion);

        if ( upgradeAvailable ) {
          highestVersion = upgradeAvailable;
        }
      }

      if ( !highestVersion ) {
        // Find the highest chart version for the current appVersion
        const chartsWithCurrentAppVersion = chartVersions?.filter(v => v.appVersion === installedAppVersion);

        if ( !chartsWithCurrentAppVersion ) {
          return null;
        }

        const highestChartForCurrentVersion = chartsWithCurrentAppVersion
          .sort((a, b) => semver.rcompare(a.version, b.version))[0];

        if ( highestChartForCurrentVersion && installedChartVersion && semver.gt(highestChartForCurrentVersion.version, installedChartVersion) ) {
          highestVersion = installedAppVersion;
        }
      }

      if ( highestVersion && chartVersions && chartVersions.length > 0 ) {
        // Find the chart with the highest chart version for the highest appVersion
        const matchingCharts = chartVersions
          .filter(v => v.appVersion === highestVersion)
          .sort((a, b) => semver.rcompare(a.version, b.version));

        return matchingCharts.length > 0 ? matchingCharts[0] : null;
      }
    }
  }

  return null;
}

/**
 * Validates if an upgrade version is a valid upgrade from the current version.
 *
 * @param currentVersion - The current version of the application.
 * @param upgradeVersion - The potential upgrade version.
 * @param highestVersion - The highest version found so far.
 * @returns string | null - The valid upgrade version or null if no valid upgrade is found.
 */
export function getValidUpgrade(currentVersion: string, upgradeVersion: string, highestVersion: string): string | null {
  if ( !currentVersion || !upgradeVersion ) {
    return null;
  }

  const currentMajor = semver.major(currentVersion);
  const currentMinor = semver.minor(currentVersion);

  const upgradeMajor = semver.major(upgradeVersion);
  const upgradeMinor = semver.minor(upgradeVersion);
  const upgradePatch = semver.patch(upgradeVersion);

  let highestMajor, highestMinor, highestPatch;

  if ( highestVersion ) {
    highestMajor = semver.major(highestVersion);
    highestMinor = semver.minor(highestVersion);
    highestPatch = semver.patch(highestVersion);
  } else {
    // Default to current version's major and minor, and -1 for patch if there's no highest version yet
    highestMajor = currentMajor;
    highestMinor = currentMinor;
    highestPatch = -1;
  }

  // Skip versions that are not upgrades
  if ( semver.lte(upgradeVersion, currentVersion) ) {
    return null;
  }

  // Determine if the upgrade is valid based on the major and minor versions
  const isValidUpgrade = ( upgradeMajor === currentMajor && upgradeMinor === currentMinor + 1 ) ||
                         ( upgradeMajor === currentMajor + 1 && upgradeMinor === 0 );

  if ( isValidUpgrade ) {
    // If it's a valid upgrade, check if it's higher than the current highest version
    if ( !highestVersion || semver.gt(upgradeVersion, highestVersion) ) {
      return upgradeVersion;
    }
  }

  // Check for a higher patch version within the same minor version
  if ( upgradeMajor === highestMajor && upgradeMinor === highestMinor && upgradePatch > highestPatch ) {
    return upgradeVersion;
  }

  return null;
}

/**
 * Finds the kubewarden-defaults chart that has an appVersion matching the appVersion of the installed kubewarden-controller chart.
 *
 * @param controllerApp - The installed kubewarden-controller application object.
 * @param defaultsChart - The kubewarden-defaults chart object containing version information.
 * @returns Version | null - The matching kubewarden-defaults chart version or null if no matching version is found.
 */
export function findCompatibleDefaultsChart(
  controllerApp: CatalogApp | null,
  defaultsChart: Chart | null
): Version | null {
  const controllerAppVersion = controllerApp?.spec?.chart?.metadata?.appVersion;
  const versions = defaultsChart?.versions;

  if (!controllerAppVersion || !Array.isArray(versions) || versions.length === 0) {
    return null;
  }

  versions.sort((a, b) => semver.rcompare(a.version, b.version));

  // Find the first matching appVersion
  return versions.find(v => v.appVersion === controllerAppVersion) || null;
}
