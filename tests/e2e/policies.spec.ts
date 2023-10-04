import { test } from './rancher-test';
import type { RancherUI } from './pages/rancher-ui';
import { Policy, generateName } from './pages/basepolicypage';
import { ClusterAdmissionPoliciesPage } from './pages/clusteradmissionpolicies.page';

test.describe.configure({ mode: 'parallel' });

const polmode   = 'Monitor'
const polserver = process.env.server || 'default'
const polkeep   = process.env.keep || false

const policyList: {title: Policy["title"], action?: Policy["settings"], skip?: string }[] = [
  { title: 'Custom Policy', action: setupCustomPolicy },
  { title: 'Allow Privilege Escalation PSP', action: undefined },
  { title: 'Allowed Fs Groups PSP', action: undefined },
  { title: 'Allowed Proc Mount Types PSP', action: undefined },
  { title: 'Apparmor PSP', action: undefined },
  { title: 'Capabilities PSP', action: undefined },
  { title: 'Deprecated API Versions', action: setupDeprecatedAPIVersions },
  { title: 'Disallow Service Loadbalancer' },
  { title: 'Disallow Service Nodeport' },
  { title: 'Echo' },
  { title: 'Environment Variable Secrets Scanner' },
  { title: 'Environment Variable Policy', action: setupEnvironmentVariablePolicy },
  { title: 'Flexvolume Drivers Psp', action: undefined },
  { title: 'Host Namespaces PSP', action: undefined },
  { title: 'Hostpaths PSP', action: undefined },
  { title: 'Ingress Policy', action: undefined },
  { title: 'Namespace label propagator', action: setupNamespaceLabelPropagator },
  { title: 'Pod Privileged Policy' },
  { title: 'Pod Runtime', action: undefined },
  { title: 'PSA Label Enforcer', action: setupPSALabelEnforcer },
  { title: 'Readonly Root Filesystem PSP' },
  { title: 'Safe Annotations', action: undefined },
  { title: 'Safe Labels', action: undefined },
  { title: 'Seccomp PSP', action: undefined },
  { title: 'Selinux PSP', action: setupSelinuxPSP },
  { title: 'Sysctl PSP', action: undefined },
  { title: 'Trusted Repos', skip: 'https://github.com/kubewarden/ui/issues/308' },
  { title: 'User Group PSP', action: setupUserGroupPSP },
  { title: 'Verify Image Signatures', action: setupVerifyImageSignatures },
  { title: 'volumeMounts', action: setupVolumeMounts },
  { title: 'Volumes PSP', action: undefined },
]

async function setupNamespaceLabelPropagator(ui: RancherUI) {
  await ui.page.getByRole('tab', { name: 'Settings' }).click()

  const s = ui.page.locator('#Settings')
  await s.getByRole('button', { name: 'Add'}).click()
  await s.getByRole('textbox').last().fill('cost-center')
}

async function setupPSALabelEnforcer(ui: RancherUI) {
  await ui.page.getByRole('tab', { name: 'Settings' }).click()
  await ui.select('Enforce', 'baseline')
}

async function setupCustomPolicy(ui: RancherUI) {
  await ui.input('Module*').fill('ghcr.io/kubewarden/policies/pod-privileged:v0.2.5')

  await ui.page.getByRole('tab', { name: 'Rules' }).click()
  await ui.select('Resource type*', 'pods')
  await ui.select('API Versions*', 'v1')
  await ui.select('Operation type*', 'CREATE')
}

async function setupVolumeMounts(ui: RancherUI) {
  await ui.page.getByRole('tab', { name: 'Settings' }).click()

  await ui.select('Reject', 'anyIn')
  await ui.page.getByRole('button', { name: 'Add'}).click()
  await ui.page.getByPlaceholder('e.g. bar').fill('/nomount')
}

async function setupSelinuxPSP(ui: RancherUI) {
  await ui.page.getByRole('tab', { name: 'Settings' }).click()
  await ui.select('SE Linux Options', 'RunAsAny')
}

async function setupDeprecatedAPIVersions(ui: RancherUI) {
  await ui.page.getByRole('tab', { name: 'Settings' }).click()
  await ui.input('Kubernetes Version*').fill('v1.24.9+k3s2')
}

async function setupVerifyImageSignatures(ui: RancherUI) {
  await ui.page.getByRole('tab', { name: 'Settings' }).click()
  await ui.select('Signature Type', 'GithubAction')
  await ui.page.getByRole('button', {name: 'Add', exact: true}).click()
  await ui.input('Image*').fill('ghcr.io/kubewarden/*')
  await ui.editYaml(d => d.githubActions.owner = "kubewarden")
}

async function setupEnvironmentVariablePolicy(ui: RancherUI) {
  await ui.page.getByRole('tab', { name: 'Settings' }).click()
  await ui.page.getByRole('button', {name: 'Add', exact: true}).click()
  await ui.select('Reject Operator', 'anyIn')
  await ui.editYaml(d => d.environmentVariables[0].name = "novar")
}

async function setupUserGroupPSP(ui: RancherUI) {
  await ui.page.getByRole('tab', { name: 'Settings' }).click()

  for (const role of await ui.page.getByRole('combobox').all()) {
    role.click()
    await ui.page.getByRole('option', { name: 'RunAsAny', exact: true }).click()
  }
}

// Generate installation test for every policy
for (const policy of policyList) {
  test(`install: ${policy.title}`, async ({ page, ui }) => {
    // Skip broken tests
    if (policy.skip) test.fixme(true, policy.skip)

    const p: Policy = {
      title: policy.title,
      name: generateName(policy.title),
      server: polserver,
      mode: polmode,
      settings: policy.action
    }

    const capPage = new ClusterAdmissionPoliciesPage(page)
    await capPage.goto()
    await capPage.create(p, {wait: !polkeep} )
    if (!polkeep) {
      await ui.getRow(p.name).delete()
    }
  });
}
