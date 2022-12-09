export const KUBEWARDEN_PRODUCT_NAME = 'kubewarden';
export const KUBEWARDEN_PRODUCT_GROUP = 'policies.kubewarden.io';

export const CHART_NAME = 'rancher-kubewarden';

export const KUBEWARDEN_DASHBOARD = 'dashboard';

export const KUBEWARDEN = {
  ADMISSION_POLICY:         'policies.kubewarden.io.admissionpolicy',
  CLUSTER_ADMISSION_POLICY: 'policies.kubewarden.io.clusteradmissionpolicy',
  POLICY_SERVER:            'policies.kubewarden.io.policyserver',
  SPOOFED:                  {
    POLICIES:                       'policies.kubewarden.io.policies',
    POLICY:                         'policies.kubewarden.io.policy',
    ALLOW_PRIVILEGE_ESCALATION_PSP: 'policies.kubewarden.io.policies.allow-privilege-escalation-psp',
    ALLOWED_FSGROUPS_PSP:           'policies.kubewarden.io.policies.allowed-fsgroups-psp',
    ALLOWED_PROC_MOUNT_TYPES_PSP:   'policies.kubewarden.io.policies.allowed-proc-mount-types-psp',
    APPARMOR_PSP:                   'policies.kubewarden.io.policies.apparmor-psp',
    CAPABILITIES_PSP:               'policies.kubewarden.io.policies.capabilities-psp',
    DISALLOW_SERVICE_LOADBALANCER:  'policies.kubewarden.io.policies.disallow-service-loadbalancer',
    DISALLOW_SERVICE_NODEPORT:      'policies.kubewarden.io.policies.disallow-service-nodeport',
    FLEXVOLUME_DRIVERS_PSP:         'policies.kubewarden.io.policies.flexvolume-drivers-psp',
    HOST_NAMESPACES_PSP:            'policies.kubewarden.io.policies.host-namespaces-psp',
    HOSTPATHS_PSP:                  'policies.kubewarden.io.policies.hostpaths-psp',
    INGRESS:                        'policies.kubewarden.io.policies.ingress',
    POD_PRIVILEGED_POLICY:          'policies.kubewarden.io.policies.pod-privileged-policy',
    POD_RUNTIME:                    'policies.kubewarden.io.policies.pod-runtime',
    READONLY_ROOT_FILESYSTEM_PSP:   'policies.kubewarden.io.policies.readonly-root-filesystem-psp',
    SAFE_ANNOTATIONS:               'policies.kubewarden.io.policies.safe-annotations',
    SAFE_LABELS:                    'policies.kubewarden.io.policies.safe-labels',
    SECCOMP_PSP:                    'policies.kubewarden.io.policies.seccomp-psp',
    SELINUX_PSP:                    'policies.kubewarden.io.policies.selinux-psp',
    SYSCTL_PSP:                     'policies.kubewarden.io.policies.sysctl-psp',
    TRUSTED_REPOS:                  'policies.kubewarden.io.policies.trusted-repos',
    USER_GROUP_PSP:                 'policies.kubewarden.io.policies.user-group-psp',
    VERIFY_IMAGE_SIGNATURES:        'policies.kubewarden.io.policies.verify-image-signatures',
    VOLUMES_PSP:                    'policies.kubewarden.io.policies.volumes-psp'
  }
};

export const METRICS_DASHBOARD = {
  POLICY_SERVER: 'kubewarden-dashboard-policyserver',
  POLICY:        'kubewarden-dashboard-policy'
};

export const VALUES_STATE = {
  FORM: 'FORM',
  YAML: 'YAML',
};

export const YAML_OPTIONS = [
  {
    labelKey: 'catalog.install.section.chartOptions',
    value:    VALUES_STATE.FORM,
  },
  {
    labelKey: 'catalog.install.section.valuesYaml',
    value:    VALUES_STATE.YAML,
  }
];

export const ADMISSION_POLICY_STATE = {
  name:      'policyStatus',
  sort:      ['stateSort', 'nameSort'],
  value:     'status.policyStatus',
  label:     'Status',
  width:     100,
  formatter: 'PolicyStatus',
};

export const ADMISSION_POLICY_MODE = {
  name:      'mode',
  label:     'Mode',
  value:     'spec.mode',
  formatter: 'PolicyMode'
};

export const ADMISSION_POLICY_RESOURCES = {
  name:      'resources',
  label:     'Resources',
  value:     'spec.rules',
  formatter: 'PolicyResources'
};

export const ADMISSION_POLICY_OPERATIONS = {
  name:      'operations',
  label:     'Operations',
  value:     'spec.rules',
  formatter: 'PolicyResources'
};

export const RELATED_POLICY_SUMMARY = {
  name:      'summary',
  label:     'Policies',
  value:     'allRelatedPolicies.length',
  sort:      false,
  search:    false,
  formatter: 'PolicySummaryGraph'
};

export const RELATED_HEADERS = [
  ADMISSION_POLICY_STATE,
  {
    name:   'name',
    value:  'metadata.name',
    label:  'Name',
    sort:   'name:desc'
  },
  ADMISSION_POLICY_MODE,
  ADMISSION_POLICY_RESOURCES,
  ADMISSION_POLICY_OPERATIONS,
  {
    name:      'psCreated',
    label:     'Created',
    value:     'metadata.creationTimestamp',
    formatter: 'LiveDate'
  }
];
