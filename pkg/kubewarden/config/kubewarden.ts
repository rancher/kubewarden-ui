import { rootKubewardenRoute, createKubewardenRoute } from '../utils/custom-routing';
import { KUBEWARDEN, KUBEWARDEN_DASHBOARD, KUBEWARDEN_PRODUCT_NAME } from '../types';
import { POLICY_SERVER_HEADERS, POLICY_HEADERS } from './table-headers';

export function init($plugin: any, store: any) {
  const {
    product,
    basicType,
    weightType,
    virtualType,
    headers,
    configureType,
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

  configureType(POLICY_SERVER, { customRoute: createKubewardenRoute({ name: `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster-resource`, params: { resource: KUBEWARDEN.POLICY_SERVER, product: KUBEWARDEN_PRODUCT_NAME } }) });

  configureType(ADMISSION_POLICY, { customRoute: createKubewardenRoute({ name: `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster-resource`, params: { resource: KUBEWARDEN.ADMISSION_POLICY, product: KUBEWARDEN_PRODUCT_NAME } }) });

  configureType(CLUSTER_ADMISSION_POLICY, { customRoute: createKubewardenRoute({ name: `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster-resource`, params: { resource: KUBEWARDEN.CLUSTER_ADMISSION_POLICY, product: KUBEWARDEN_PRODUCT_NAME } }) });

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
