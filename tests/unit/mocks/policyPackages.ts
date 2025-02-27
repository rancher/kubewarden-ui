import { ArtifactHubPackage } from '@kubewarden/types';

export const exampleData: {[key: string]: string} = {
  'kubewarden/rules':        "- apiGroups:\n  - ''\n  apiVersions:\n  - v1\n  resources:\n  - pods\n  operations:\n  - CREATE\n- apiGroups:\n  - ''\n  apiVersions:\n  - v1\n  resources:\n  - replicationcontrollers\n  operations:\n  - CREATE\n  - UPDATE\n- apiGroups:\n  - apps\n  apiVersions:\n  - v1\n  resources:\n  - deployments\n  - replicasets\n  - statefulsets\n  - daemonsets\n  operations:\n  - CREATE\n  - UPDATE\n- apiGroups:\n  - batch\n  apiVersions:\n  - v1\n  resources:\n  - jobs\n  - cronjobs\n  operations:\n  - CREATE\n  - UPDATE\n",
  'kubewarden/mutation':     'true',
  'kubewarden/resources':    'Pod, Replicationcontroller, Deployments, Replicaset, Statefulset, Daemonset, Job, Cronjob',
  'kubewarden/questions-ui': "questions:\n- default: null\n  description: >-\n    This policy is designed to enforce constraints on the resource requirements\n    of Kubernetes containers.\n  group: Settings\n  label: Description\n  required: false\n  hide_input: true\n  type: string\n  variable: description\n- default: {}\n  description: Defines the limit and minimum amount requested for CPU resource\n  group: Settings\n  label: CPU\n  hide_input: true\n  type: map[\n  variable: cpu\n  subquestions:\n    - default: ''\n      tooltip: >-\n        Defines default minimum CPU requested.\n      group: Settings\n      label: Default CPU requested\n      type: string\n      variable: cpu.defaultRequest\n    - default: ''\n      tooltip: >-\n        Defines default CPU limit value.\n      group: Settings\n      label: Default CPU limit\n      type: string\n      variable: cpu.defaultLimit\n    - default: ''\n      tooltip: >-\n        Defines maximum limit value allowed to be set for the CPU resource\n      group: Settings\n      label: Max CPU limit allowed\n      type: string\n      variable: cpu.maxLimit\n- default: {}\n  description: Defines the limit and minimum amount requested for memory resource\n  group: Settings\n  label: Memory\n  hide_input: true\n  type: map[\n  variable: memory\n  subquestions:\n    - default: ''\n      tooltip: >-\n        Defines default minimum memory requested.\n      group: Settings\n      label: Default memory requested\n      type: string\n      variable: memory.defaultRequest\n    - default: ''\n      tooltip: >-\n        Defines default memory limit value.\n      group: Settings\n      label: Default memory limit\n      type: string\n      variable: memory.defaultLimit\n    - default: ''\n      tooltip: >-\n        Defines maximum limit value allowed to be set for the memory resource\n      group: Settings\n      label: Max memory limit allowed\n      type: string\n      variable: memory.maxLimit\n- default: []\n  description: >-\n    Configuration used to exclude containers from enforcement\n  group: Settings\n  label: Ignore images\n  type: array[\n  value_multiline: false\n  variable: ignoreImages\n"
};

export const policyPackages: ArtifactHubPackage[] = [
  {
    name:         'allow-privilege-escalation-psp',
    display_name: 'Allow Privilege Escalation PSP',
    description:  'Replacement for the Kubernetes Pod Security Policy that controls the allowance of privilege escalation in containers and init containers of a pod',
    keywords:     ['PSP', 'privilege escalation'],
    data:         { 'kubewarden/resources': 'Deployment,Replicaset,Statefulset,Daemonset,Replicationcontroller,Job,Cronjob,Pod' },
    signed:       true,
    signatures:   ['cosign'],
    repository:   {
      organization_name:         'kubewarden',
      organization_display_name: 'Kubewarden Developers'
    }
  },
  {
    name:            'deprecated-api-versions',
    normalized_name: 'deprecated-api-versions',
    display_name:    'Deprecated API Versions',
    description:     'Find deprecated and removed Kubernetes resources',
    keywords:        [
      'compliance',
      'deprecated API'
    ],
    data:               { 'kubewarden/resources': '*' },
    version:            '0.1.12-k8sv1.29.0',
    available_versions: [
      {
        version:                   '0.1.12-k8sv1.29.0',
        contains_security_updates: false,
        prerelease:                false,
      }
    ],
    prerelease: false,
    provider:   'kubewarden',
    repository: {
      name:                      'deprecated-api-versions-policy',
      display_name:              'Deprecated API Versions',
      url:                       'https://github.com/kubewarden/deprecated-api-versions-policy',
      organization_name:         'kubewarden',
      organization_display_name: 'Kubewarden Developers'
    },
  },
  {
    name:            'container-resources',
    normalized_name: 'container-resources',
    display_name:    'Container Resources',
    description:     'Policy is designed to enforce constraints on the resource requirements of Kubernetes containers',
    keywords:        [
      'container',
      'resources'
    ],
    home_url:           'https://github.com/kubewarden/container-resources-policy',
    data:               exampleData,
    version:            '0.1.0-rc1',
    available_versions: [
      {
        version:                   '0.1.0-rc1',
        contains_security_updates: false,
        prerelease:                false,
      }
    ],
    prerelease:        false,
    signed:            false,
    containers_images: [
      {
        name:        'policy',
        image:       'ghcr.io/kubewarden/policies/container-resources:v0.1.0',
        whitelisted: false
      }
    ],
    provider:   'kubewarden',
    repository: {
      name:                      'container-resources',
      display_name:              'Container resources',
      url:                       'https://github.com/kubewarden/container-resources-policy',
      organization_name:         'kubewarden',
      organization_display_name: 'Kubewarden Developers'
    },
  },
  {
    name:            'psa-label-enforcer',
    normalized_name: 'psa-label-enforcer',
    display_name:    'PSA Label Enforcer',
    description:     'Policy to ensure that namespaces have the required PSA labels configuration for deployment in the cluster.',
    keywords:        [
      'namespace',
      'psa',
      'kubewarden'
    ],
    home_url: 'https://github.com/kubewarden/psa-label-enforcer',
    data:     {
      'kubewarden/mutation':  'true',
      'kubewarden/resources': 'Namespace',
    },
    version:            '0.1.3',
    available_versions: [
      {
        version:                   '0.1.3',
        contains_security_updates: false,
        prerelease:                false,
      }
    ],
    prerelease: false,
    signed:     true,
    signatures: [
      'cosign'
    ],
    containers_images: [
      {
        name:        'policy',
        image:       'ghcr.io/kubewarden/policies/psa-label-enforcer:v0.1.3',
        whitelisted: false
      }
    ],
    provider:   'kubewarden',
    repository: {
      name:                      'psa-label-enforcer',
      display_name:              'PSA Label Enforcer',
      url:                       'https://github.com/kubewarden/psa-label-enforcer-policy',
      organization_name:         'kubewarden',
      organization_display_name: 'Kubewarden Developers'
    },
  },
  {
    name:         'signed-test-policy',
    display_name: 'Signed Test Policy',
    description:  'A signed test policy with no signatures',
    signed:       true,
    repository:   { user_alias: 'evil' }
  },
  {
    name:         'test-policy',
    display_name: 'Test Policy',
    description:  'A test policy with no info'
  },
  {
    name:         'test-policy-2',
    display_name: 'Test Policy 2',
    description:  'A test policy with less info',
    data:         { 'kubewarden/resources': 'Daemonset' },
    keywords:     ['PSP'],
    repository:   {
      name:                      'test-policy-2',
      display_name:              'test-policy-2',
      url:                       'https://github.com/test-org/test-policy-2',
      user_alias:                'evil'
    }
  },
  {
    name:              'duplicate-test-policy',
    display_name:      'Duplicate Test Policy',
    description:       'A duplicate test policy with different repositories',
    data:              { 'kubewarden/resources': 'Daemonset' },
    home_url:          'https://github.com/duplicate-policy-org-1/duplicate-test-policy',
    keywords:          ['PSP'],
    containers_images: [
      {
        name:        'policy',
        image:       'ghcr.io/duplicate-policy-org-1/policies/duplicate-test-policy:v0.1.0',
        whitelisted: false
      }
    ],
    readme:     'duplicate test policy org 1 readme',
    repository:   {
      name:                      'duplicate-test-policy',
      display_name:              'duplicate-test-policy',
      url:                       'https://github.com/duplicate-policy-org-1/duplicate-test-policy',
      user_alias:                'honorable'
    }
  },
  {
    name:              'duplicate-test-policy',
    display_name:      'Duplicate Test Policy',
    description:       'A duplicate test policy with different repositories',
    data:              { 'kubewarden/resources': 'Daemonset' },
    home_url:          'https://github.com/duplicate-policy-org-2/duplicate-test-policy',
    keywords:          ['PSP'],
    containers_images: [
      {
        name:        'policy',
        image:       'ghcr.io/duplicate-policy-org-2/policies/duplicate-test-policy:v0.1.0',
        whitelisted: false
      }
    ],
    readme:     'duplicate test policy org 2 readme',
    repository:   {
      name:                      'duplicate-test-policy',
      display_name:              'duplicate-test-policy',
      url:                       'https://github.com/duplicate-policy-org-2/duplicate-test-policy',
      user_alias:                'dishonorable'
    }
  },
];
