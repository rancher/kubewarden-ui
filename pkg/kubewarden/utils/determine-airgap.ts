import isEmpty from 'lodash/isEmpty';
import { MANAGEMENT } from '@shell/config/types';

import { handleGrowl } from './handle-growl';

interface AirgapConfig {
  store: any
}

/**
 * Preforms a dispatch request on the first index within the
 * `management.cattle.io.settings/whitelist-domain` setting.
 * @param context - The store context
 * @returns Boolean - Will return `true` if request does not have a response status of `200`
 */
export async function isAirgap(context: AirgapConfig): Promise<Boolean> {
  const { store } = context;

  try {
    await store.dispatch('management/findAll', { type: MANAGEMENT.SETTING });
    const whitelist = await store.getters['management/byId'](MANAGEMENT.SETTING, 'whitelist-domain');

    if ( !isEmpty(whitelist) && whitelist.value?.length > 0 ) {
      const whitelistedDomain = whitelist.value.split(',')[0];

      const res = await store.dispatch('management/request', {
        url:                  `/meta/proxy/${ whitelistedDomain }`,
        method:               'GET',
        redirectUnauthorized: false,
      });

      if ( res._status !== 200 ) {
        store.dispatch('kubewarden/updateAirGapped', true);

        return true;
      }

      store.dispatch('kubewarden/updateAirGapped', false);

      return false;
    }
  } catch (e) {
    if ( !store.getters['kubewarden/airGapped'] ) {
      const error = {
        _statusText: 'Warning',
        message:     'Unable to determine management.cattle.io.settings/whitelist-domain value. Some Kubewarden UI features may be unavailable.'
      };

      handleGrowl({
        error, store, type: 'warning'
      });
      store.dispatch('kubewarden/updateAirGapped', true);
    }

    return true;
  }

  store.dispatch('kubewarden/updateAirGapped', true);

  return true;
}
