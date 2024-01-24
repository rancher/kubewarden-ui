import { Chart } from '../types';
import { handleGrowl } from './handle-growl';

export interface RefreshConfig {
  store: any;
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
