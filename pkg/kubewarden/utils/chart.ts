import { Chart } from '../types';

import { handleGrowl } from './handle-growl';

export interface RefreshConfig {
  store: any,
  retry?: number,
  init?: boolean,
  chart?: Chart
}

export interface ReloadReady {
  reloadReady: boolean
}

export async function refreshCharts(config: RefreshConfig): Promise<ReloadReady> {
  const { store, init, chart } = config;
  let { retry } = config;

  if ( !retry ) {
    retry = 0;
  }

  try {
    store.dispatch('kubewarden/updateRefreshingCharts', true);

    await store.dispatch('catalog/refresh');
  } catch (e) {
    handleGrowl({ error: e as any, store });
  }

  if ( !chart && retry === 0 && !init ) {
    store.dispatch('kubewarden/updateRefreshingCharts', true);

    await store.dispatch('catalog/refresh');
    await refreshCharts({
      store, init, retry: retry + 1, chart
    });
  }

  if ( !chart && retry === 1 && !init ) {
    return { reloadReady: true };
  }

  store.dispatch('kubewarden/updateRefreshingCharts', false);

  return { reloadReady: false };
}
