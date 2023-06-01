import { test, expect } from './rancher-test';
import type { RancherUI } from './pages/rancher-ui';

test.describe.configure({ mode: 'parallel' });

const polmode   = process.env.mode || 'monitor'
const polserver = process.env.server || 'default'
const polkeep   = process.env.keep || false

const policies = [
  { name: 'Custom Policy', action: setupCustomPolicy },
  { name: 'Allow Privilege Escalation PSP', action: undefined },
  { name: 'Allowed Fs Groups PSP', action: undefined },
  { name: 'Allowed Proc Mount Types PSP', action: undefined },
  { name: 'Apparmor PSP', action: undefined },
  { name: 'Capabilities PSP', action: undefined },
  { name: 'Deprecated API Versions', action: setupDeprecatedAPIVersions },
  { name: 'Disallow Service Loadbalancer' },
  { name: 'Disallow Service Nodeport' },
  { name: 'Echo' },
  { name: 'Environment Variable Secrets Scanner' },
  { name: 'Environment Variable Policy', action: setupEnvironmentVariablePolicy },
  { name: 'Flexvolume Drivers Psp', action: undefined },
  { name: 'Host Namespaces PSP', action: undefined },
  { name: 'Hostpaths PSP', action: undefined },
  { name: 'Ingress Policy', action: undefined },
  { name: 'Namespace Label Propagator', action: setupNamespaceLabelPropagator, skip: 'https://github.com/kubewarden/namespace-label-propagator-policy/issues/6' },
  { name: 'Pod Privileged Policy' },
  { name: 'Pod Runtime', action: undefined },
  { name: 'PSA Label Enforcer', action: setupPSALabelEnforcer },
  { name: 'Readonly Root Filesystem PSP' },
  { name: 'Safe Annotations', action: undefined },
  { name: 'Safe Labels', action: undefined },
  { name: 'Seccomp PSP', action: undefined },
  { name: 'Selinux PSP', action: setupSelinuxPSP },
  { name: 'Sysctl PSP', action: undefined },
  { name: 'Trusted Repos', skip: 'https://github.com/kubewarden/ui/issues/308' },
  { name: 'User Group PSP', action: setupUserGroupPSP },
  { name: 'Verify Image Signatures', action: setupVerifyImageSignatures },
  { name: 'volumeMounts', action: setupVolumeMounts },
  { name: 'Volumes PSP', action: undefined },
]

async function setupNamespaceLabelPropagator(ui: RancherUI) {
  await ui.page.getByRole('tab', { name: 'Settings' }).click()
  // Fill settings after initial issue is fixed
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
  await ui.editYaml(ui.page, d => d.githubActions.owner = "kubewarden")
}

async function setupEnvironmentVariablePolicy(ui: RancherUI) {
  await ui.page.getByRole('tab', { name: 'Settings' }).click()
  await ui.page.getByRole('button', {name: 'Add', exact: true}).click()
  await ui.select('Reject Operator', 'anyIn')
  await ui.editYaml(ui.page, d => d.environmentVariables[0].name = "novar")
}

async function setupUserGroupPSP(ui: RancherUI) {
  await ui.page.getByRole('tab', { name: 'Settings' }).click()

  for (const role of await ui.page.getByRole('combobox').all()) {
    role.click()
    await ui.page.getByRole('option', { name: 'RunAsAny', exact: true }).click()
  }
}

// Generate installation test for every policy.
for (const policy of policies) {
  test(`install: ${policy.name}`, async ({ page, ui }) => {
    const polname = 'test-' + policy.name.replace(/\s+/g, '-').toLowerCase()

    // Skip broken tests
    if (policy.skip) test.fixme(true, policy.skip)

    await page.goto('/dashboard/c/local/kubewarden/policies.kubewarden.io.clusteradmissionpolicy/create')
    await expect(page.getByRole('heading', { name: 'Finish: Step 1' })).toBeVisible()

    // Select policy, skip readme
    await page.getByRole('heading', { name: policy.name, exact: true }).click()
    await page.getByRole('tab', { name: 'Values' }).click()

    // Fill general values
    await ui.input('Name*').fill(polname)
    await ui.select('Policy Server', polserver)
    await page.getByRole('radio', {name: polmode}).check()

    if (policy.action) {
      // Fill extra policy settings
      await policy.action(ui)
      // Give generated fields time to get registered
      await ui.page.waitForTimeout(200)
      // Show yaml with edited settings
      await page.getByRole('button', { name: 'Edit YAML' }).click()
    }

    // Create policy - redirects to policies list
    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page).toHaveURL(/.*clusteradmissionpolicy$/)
    await expect(page.getByRole('link', {name: polname, exact: true})).toBeVisible()

    // Check new policy
    const polRow = ui.getRow(polname)
    await expect(polRow.body).toBeVisible()
    if (!polkeep) {
      // Waiting for policy takes 1m, check only if we delete it
      await expect(polRow.column('Status')).toHaveText('Active', {timeout: 220_000})
      await polRow.delete()
    }
  });
}
