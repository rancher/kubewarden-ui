import { AGE, STATE, NAME as NAME_HEADER } from '@shell/config/table-headers';

import {
  KUBEWARDEN,
  KUBEWARDEN_DASHBOARD,
  ADMISSION_POLICY_STATE,
  ADMISSION_POLICY_MODE,
  ADMISSION_POLICY_RESOURCES,
  ADMISSION_POLICY_OPERATIONS,
  RELATED_POLICY_SUMMARY
} from '../types';
import { rootKubewardenRoute } from '../utils/custom-routing';

export function init($plugin, store) {
  const {
    product,
    basicType,
    spoofedType,
    weightType,
    virtualType,
    headers,
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
    label:       store.getters['i18n/t']('kubewarden.dashboard'),
    icon:        'kubewarden',
    name:        KUBEWARDEN_DASHBOARD,
    namespaced:  false,
    weight:      99,
    route:       rootKubewardenRoute(),
    overview:    true
  });

  /*
    TODO: remove these when rancher-charts integration is complete
  */
  // These are policies from the Policy Hub
  spoofedType({
    label:   'Policies',
    type:    SPOOFED.POLICIES,
    schemas: [
      {
        id:              SPOOFED.POLICIES,
        type:            'schema',
        resourcesFields: { policies: { type: `array[${ SPOOFED.POLICY }]` } }
      },
      {
        id:             SPOOFED.POLICY,
        type:           'schema',
        resourceFields: {
          allow_privilege_escalation_psp: { type: SPOOFED.ALLOW_PRIVILEGE_ESCALATION_PSP },
          allowed_fsgroups_psp:           { type: SPOOFED.ALLOWED_FSGROUPS_PSP },
          allowed_proc_mount_types_psp:   { type: SPOOFED.ALLOWED_PROC_MOUNT_TYPES_PSP },
          apparmor_psp:                   { type: SPOOFED.APPARMOR_PSP },
          capabilities_psp:               { type: SPOOFED.CAPABILITIES_PSP },
          disallow_service_loadbalancer:  { type: SPOOFED.DISALLOW_SERVICE_LOADBALANCER },
          disallow_service_nodeport:      { type: SPOOFED.DISALLOW_SERVICE_NODEPORT },
          flexvolume_drivers_psp:         { type: SPOOFED.FLEXVOLUME_DRIVERS_PSP },
          host_namespaces_psp:            { type: SPOOFED.HOST_NAMESPACES_PSP },
          hostpaths_psp:                  { type: SPOOFED.HOSTPATHS_PSP },
          ingress:                        { type: SPOOFED.INGRESS },
          pod_privileged_policy:          { type: SPOOFED.POD_PRIVILEGED_POLICY },
          pod_runtime:                    { type: SPOOFED.POD_RUNTIME },
          readonly_root_filesystem_psp:   { type: SPOOFED.READONLY_ROOT_FILESYSTEM_PSP },
          safe_annotations:               { type: SPOOFED.SAFE_ANNOTATIONS },
          safe_labels:                    { type: SPOOFED.SAFE_LABELS },
          seccomp_psp:                    { type: SPOOFED.SECCOMP_PSP },
          selinux_psp:                    { type: SPOOFED.SELINUX_PSP },
          sysctl_psp:                     { type: SPOOFED.SYSCTL_PSP },
          trusted_repos:                  { type: SPOOFED.TRUSTED_REPOS },
          user_group_psp:                 { type: SPOOFED.USER_GROUP_PSP },
          verify_image_signatures:        { type: SPOOFED.VERIFY_IMAGE_SIGNATURES },
          volumes_psp:                    { type: SPOOFED.VOLUMES_PSP },
        }
      }
    ]
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

  headers(POLICY_SERVER, [
    STATE,
    {
      name:          'name',
      labelKey:      'tableHeaders.name',
      value:         'nameDisplay',
      sort:          ['nameSort'],
      formatter:     'PolicyServerDeployment',
      canBeVariable: true,
    },
    {
      name:          'kubewardenPolicyServers',
      label:         'Image',
      value:         'spec.image',
      formatterOpts: {
        options: { internal: true },
        to:      {
          name:   'c-cluster-product-resource-id',
          params: { resource: POLICY_SERVER }
        }
      },
    },
    RELATED_POLICY_SUMMARY,
    AGE
  ]);

  headers(ADMISSION_POLICY, [
    ADMISSION_POLICY_STATE,
    NAME_HEADER,
    ADMISSION_POLICY_MODE,
    {
      name:  'capPolicyServer',
      label: 'Policy Server',
      value: 'spec.policyServer'
    },
    ADMISSION_POLICY_RESOURCES,
    ADMISSION_POLICY_OPERATIONS,
    AGE
  ]);

  headers(CLUSTER_ADMISSION_POLICY, [
    ADMISSION_POLICY_STATE,
    NAME_HEADER,
    ADMISSION_POLICY_MODE,
    {
      name:  'capPolicyServer',
      label: 'Policy Server',
      value: 'spec.policyServer'
    },
    ADMISSION_POLICY_RESOURCES,
    ADMISSION_POLICY_OPERATIONS,
    AGE
  ]);
}
