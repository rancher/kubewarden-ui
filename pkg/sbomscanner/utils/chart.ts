import { Chart } from "@pkg/types";
import { handleGrowl } from "@pkg/utils/handle-growl";
import isEmpty from 'lodash/isEmpty';
import semver from 'semver';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';

export interface RefreshConfig {
  store: any;
  chartName: string;
  retry?: number;
  init?: boolean;
}

export interface ReloadReady {
  reloadReady: boolean;
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
export async function refreshCharts(
  config: RefreshConfig
): Promise<ReloadReady> {
  const { store, chartName, init } = config;
  let retry = config.retry ?? 0;

  while (retry < 3) {
    const rawCharts = store.getters["catalog/rawCharts"];
    const chart = (Object.values(rawCharts) as Chart[])?.find(
      (c) => c?.chartName === chartName
    );

    if (!chart) {
      try {
        // TODO: Add Custom VueX store for neuvector: { refreshingCharts: false }
        // store.dispatch("neuvector/updateRefreshingCharts", true);
        await store.dispatch("catalog/refresh");
      } catch (e) {
        handleGrowl({ error: e as any, store });
      } finally {
        // store.dispatch("neuvector/updateRefreshingCharts", false);
      }

      if (retry < 2 && !init) {
        retry++;
        continue;
      }
    }
    break;
  }

  return { reloadReady: false };
}

export function getLatestVersion(store: any, versions: any[]) {
  const showPreRelease = store.getters['prefs/get'](SHOW_PRE_RELEASE);
  const versionMap = versions?.map((v) => v.version)
    .filter((v) => showPreRelease ? v : !semver.prerelease(v));
  const sorted = versionMap.sort((a, b) => {
    const aSem = semver.coerce(a);
    const bSem = semver.coerce(b);

    // Handle nulls safely
    if (!aSem && !bSem) return 0;
    if (!aSem) return 1;
    if (!bSem) return -1;

    return semver.rcompare(aSem, bSem);
  });

  return sorted[0];
}

export function getLatestStableVersion(versions: any[]): string | undefined {
  const allVersions = versions.map(v => v.version);
  const stableVersions = versions.filter(v => !v.version.includes('b'));

  if ( isEmpty(stableVersions) && !isEmpty(allVersions) ) {
    return semver.rsort(allVersions)[0];
  }

  return stableVersions?.sort((a, b) => {
    const versionA = a.version.split('.').map(Number);
    const versionB = b.version.split('.').map(Number);

    for ( let i = 0; i < Math.max(versionA.length, versionB.length); i++ ) {
      if ( versionA[i] === undefined || versionA[i] < versionB[i] ) {
          return 1;
      }
      if ( versionB[i] === undefined || versionA[i] > versionB[i] ) {
          return -1;
      }
    }

    return 0;
  })[0];
}
