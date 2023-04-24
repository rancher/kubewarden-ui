export default [
  {
    name:         'allow-privilege-escalation-psp',
    display_name: 'Allow Privilege Escalation PSP',
    description:  'Replacement for the Kubernetes Pod Security Policy that controls the allowance of privilege escalation in containers and init containers of a pod',
    keywords:     ['PSP', 'privilege escalation'],
    data:         { 'kubewarden/resources': 'Deployment,Replicaset,Statefulset,Daemonset,Replicationcontroller,Job,Cronjob,Pod' },
    signed:       true,
    signatures:   ['cosign'],
    provider:     'kubewarden'
  },
  {
    name:         'signed-test-policy',
    display_name: 'Signed Test Policy',
    description:  'A signed test policy with no signatures',
    signed:       true,
    provider:     'evil'
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
    provider:     'evil'
  }
];
