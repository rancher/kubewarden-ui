import { rootKubewardenRoute } from '../utils/custom-routing';
import { KUBEWARDEN, KUBEWARDEN_DASHBOARD } from '../types';
import { POLICY_SERVER_HEADERS, POLICY_HEADERS } from './table-headers';

export function init($plugin: any, store: any) {
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
    label:       store.getters['i18n/t']('kubewarden.dashboard.title'),
    icon:        'kubewarden',
    name:        KUBEWARDEN_DASHBOARD,
    namespaced:  false,
    weight:      99,
    route:       rootKubewardenRoute(),
    overview:    true
  });

  /*
    TODO: remove these when artifacthub supplies the necessary info
          for the policy scaffold and questions

    These are being spoofed to iterate over the questions provided
    in ./questions/policy-questions
  */
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
          deprecated_api_versions:        { type: SPOOFED.DEPRECATED_API_VERSIONS },
          disallow_service_loadbalancer:  { type: SPOOFED.DISALLOW_SERVICE_LOADBALANCER },
          disallow_service_nodeport:      { type: SPOOFED.DISALLOW_SERVICE_NODEPORT },
          echo:                           { type: SPOOFED.ECHO },
          env_variable_secrets_scanner:   { type: SPOOFED.ENV_VARIABLE_SECRETS_SCANNER },
          environment_variable_policy:    { type: SPOOFED.ENVIRONMENT_VARIABLE_POLICY },
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
          volumemounts:                   { type: SPOOFED.VOLUMEMOUNTS },
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

  headers(POLICY_SERVER, POLICY_SERVER_HEADERS);
  headers(ADMISSION_POLICY, POLICY_HEADERS);
  headers(CLUSTER_ADMISSION_POLICY, POLICY_HEADERS);
}
