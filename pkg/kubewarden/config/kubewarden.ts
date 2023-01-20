import { rootKubewardenRoute } from '../utils/custom-routing';
import { KUBEWARDEN, KUBEWARDEN_DASHBOARD } from '../types';
import { POLICY_SERVER_HEADERS, POLICY_HEADERS } from './table-headers';

export function init($plugin: any, store: any) {
  const {
    product,
    basicType,
    weightType,
    virtualType,
    headers,
  } = $plugin.DSL(store, $plugin.name);

  const {
    POLICY_SERVER,
    ADMISSION_POLICY,
    CLUSTER_ADMISSION_POLICY
  } = KUBEWARDEN;

  product({
    inStore:             'cluster',
    inExplorer:          true,
    icon:                'kubewarden',
    removeable:          false,
    showNamespaceFilter: true
  });

  virtualType({
    label:       store.getters['i18n/t']('kubewarden.dashboard.title'),
    icon:        'kubewarden',
    name:        KUBEWARDEN_DASHBOARD,
    namespaced:  false,
    weight:      99,
    route:       rootKubewardenRoute(),
    overview:    true
  });

  basicType([
    KUBEWARDEN_DASHBOARD,
    POLICY_SERVER,
    ADMISSION_POLICY,
    CLUSTER_ADMISSION_POLICY
  ]);

  weightType(POLICY_SERVER, 98, true);
  weightType(CLUSTER_ADMISSION_POLICY, 97, true);
  weightType(ADMISSION_POLICY, 96, true);

  headers(POLICY_SERVER, POLICY_SERVER_HEADERS);
  headers(ADMISSION_POLICY, POLICY_HEADERS);
  headers(CLUSTER_ADMISSION_POLICY, POLICY_HEADERS);
}
