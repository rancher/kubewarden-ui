import { Store } from 'vuex';

import { CATALOG } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

import { KUBEWARDEN_APPS } from '@kubewarden/constants';
import { CatalogApp } from '@kubewarden/types';

export const fetchControllerApp = async(store: Store<any>): Promise<CatalogApp | undefined> => {
  if (store?.getters['cluster/schemaFor'](CATALOG.APP)) {
    const allApps: CatalogApp[] = await store.dispatch('cluster/findAll', { type: CATALOG.APP });

    const controllerApp = allApps?.find((app) => (
      app.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_CONTROLLER
    ));

    if (controllerApp) {
      store.dispatch('kubewarden/updateControllerApp', controllerApp);

      return controllerApp;
    }
  }
};
