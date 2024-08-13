import { rootKubewardenRoute } from '../utils/custom-routing';
import {
  KUBEWARDEN, KUBEWARDEN_DASHBOARD, POLICY_REPORTER_PRODUCT, KUBEWARDEN_PRODUCT_NAME, WG_POLICY_K8S, POLICY_SCHEMA
} from '../types';
import { POLICY_SERVER_HEADERS, POLICY_HEADERS } from './table-headers';

export function init($plugin: any, store: any) {
  const {
    product,
    basicType,
    configureType,
    mapType,
    weightType,
    virtualType,
    spoofedType,
    headers
  } = $plugin.DSL(store, $plugin.name);

  const {
    POLICY_SERVER,
    ADMISSION_POLICY,
    CLUSTER_ADMISSION_POLICY,
    SPOOFED
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

  virtualType({
    label:      store.getters['i18n/t']('kubewarden.policyReporter.title'),
    icon:       'notifier',
    ifHaveType: WG_POLICY_K8S.POLICY_REPORT.TYPE,
    name:       POLICY_REPORTER_PRODUCT,
    namespaced: false,
    weight:     94,
    route:      {
      name:   `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }-${ POLICY_REPORTER_PRODUCT }`,
      params: { product: KUBEWARDEN_PRODUCT_NAME }
    }
  });

  spoofedType({
    label:             'Policies',
    type:              SPOOFED.POLICY,
    collectionMethods: ['POST'],
    schemas:           [POLICY_SCHEMA],
  });

  basicType([
    KUBEWARDEN_DASHBOARD,
    POLICY_REPORTER_PRODUCT,
    SPOOFED.POLICY,
    POLICY_SERVER,
    ADMISSION_POLICY,
    CLUSTER_ADMISSION_POLICY
  ]);

  weightType(SPOOFED.POLICY, 98, true);
  weightType(POLICY_SERVER, 97, true);
  weightType(CLUSTER_ADMISSION_POLICY, 96, true);
  weightType(ADMISSION_POLICY, 95, true);

  headers(POLICY_SERVER, POLICY_SERVER_HEADERS);
  headers(ADMISSION_POLICY, POLICY_HEADERS);
  headers(CLUSTER_ADMISSION_POLICY, POLICY_HEADERS);

  mapType(SPOOFED.POLICY, 'Policy');
}
