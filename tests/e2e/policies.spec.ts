import { test } from './rancher-test'
import type { RancherUI } from './components/rancher-ui'
import { Policy, generateName, ClusterAdmissionPoliciesPage } from './pages/policies.page'
import { PolicyServersPage } from './pages/policyservers.page'

test.describe.configure({ mode: 'parallel' })

const polmode = 'Monitor'
const pserver = { name: process.env.server || 'policies-private-ps' }
const polkeep = !!process.env.keep || false

const policyList: {title: Policy['title'], settings?: Policy['settings'], skip?: string }[] = [
  { title: 'Custom Policy', settings: setupCustomPolicy },
  { title: 'Allow Privilege Escalation PSP', settings: undefined },
  { title: 'Allowed Fs Groups PSP', settings: undefined },
  { title: 'Allowed Proc Mount Types PSP', settings: undefined },
  { title: 'Apparmor PSP', settings: undefined },
  { title: 'Capabilities PSP', settings: undefined },
  { title: 'Deprecated API Versions', settings: setupDeprecatedAPIVersions },
  { title: 'Disallow Service Loadbalancer' },
  { title: 'Disallow Service Nodeport' },
  { title: 'Echo' },
  { title: 'Environment Variable Secrets Scanner' },
  { title: 'Environment Variable Policy', settings: setupEnvironmentVariablePolicy },
  { title: 'Flexvolume Drivers Psp', settings: undefined },
  { title: 'Host Namespaces PSP', settings: undefined },
  { title: 'Hostpaths PSP', settings: undefined },
  { title: 'Ingress Policy', settings: undefined },
  { title: 'Unique Ingress host' },
  { title: 'Namespace label propagator', settings: setupNamespaceLabelPropagator },
  { title: 'Pod Privileged Policy' },
  { title: 'Pod Runtime', settings: undefined },
  { title: 'PSA Label Enforcer', settings: setupPSALabelEnforcer },
  { title: 'Readonly Root Filesystem PSP' },
  { title: 'Safe Annotations', settings: undefined },
  { title: 'Safe Labels', settings: undefined },
  { title: 'Seccomp PSP', settings: undefined },
  { title: 'Selinux PSP', settings: setupSelinuxPSP },
  { title: 'Sysctl PSP', settings: undefined },
  { title: 'Trusted Repos', settings: trustedRepos },
  { title: 'User Group PSP', settings: setupUserGroupPSP },
  { title: 'Verify Image Signatures', settings: setupVerifyImageSignatures },
  { title: 'volumeMounts', settings: setupVolumeMounts },
  { title: 'Volumes PSP', settings: undefined },
]

async function trustedRepos(ui: RancherUI) {
  await ui.button('Add').first().click()
  await ui.page.getByRole('textbox').last().fill('registry.my-corp.com')
}

async function setupNamespaceLabelPropagator(ui: RancherUI) {
  await ui.button('Add').click()
  await ui.page.getByRole('textbox').last().fill('cost-center')
}

async function setupPSALabelEnforcer(ui: RancherUI) {
  await ui.select('Enforce', 'baseline')
}

async function setupCustomPolicy(ui: RancherUI) {
  await ui.tab('General').click()
  await ui.input('Module*').fill('ghcr.io/kubewarden/policies/pod-privileged:v0.2.5')

  await ui.tab('Rules').click()
  await ui.select('Resource type*', 'pods')
  await ui.select('API Versions*', 'v1')
  await ui.select('Operation type*', 'CREATE')
}

async function setupVolumeMounts(ui: RancherUI) {
  await ui.select('Reject', 'anyIn')
  await ui.button('Add').click()
  await ui.page.getByPlaceholder('e.g. bar').fill('/nomount')
}

async function setupSelinuxPSP(ui: RancherUI) {
  await ui.select('SE Linux Options', 'RunAsAny')
}

async function setupDeprecatedAPIVersions(ui: RancherUI) {
  await ui.input('Kubernetes Version*').fill('v1.24.9+k3s2')
}

async function setupVerifyImageSignatures(ui: RancherUI) {
  await ui.select('Signature Type', 'GithubAction')
  await ui.button('Add').click()
  await ui.input('Image*').fill('ghcr.io/kubewarden/*')
  await ui.editYaml((y) => { y.githubActions.owner = 'kubewarden' })
}

async function setupEnvironmentVariablePolicy(ui: RancherUI) {
  await ui.button('Add').click()
  await ui.select('Reject Operator', 'anyIn')
  await ui.editYaml((y) => { y.environmentVariables[0].name = 'novar' })
}

async function setupUserGroupPSP(ui: RancherUI) {
  for (const role of await ui.page.getByRole('combobox').all()) {
    role.click()
    await ui.page.getByRole('option', { name: 'RunAsAny', exact: true }).click()
  }
}

// Set up policy server
test.beforeAll(async({ browser }) => {
  if (pserver.name === 'default') return

  const page = await browser.newPage()
  const psPage = new PolicyServersPage(page)
  await psPage.create(pserver)
  await page.close()
})

// Delete policy server
test.afterAll(async({ browser }) => {
  if (pserver.name === 'default') return

  const page = await browser.newPage()
  const psPage = new PolicyServersPage(page)
  await psPage.delete(pserver.name)
  await page.close()
})

// Generate installation test for every policy
for (const policy of policyList) {
  test(`install: ${policy.title}`, async({ page }) => {
    // Skip broken tests
    if (policy.skip) test.fixme(true, policy.skip)

    const p: Policy = generateName({
      title   : policy.title,
      server  : pserver.name,
      mode    : polmode,
      settings: policy.settings
    })

    const capPage = new ClusterAdmissionPoliciesPage(page)
    const pRow = await capPage.create(p, { wait: !polkeep })
    if (!polkeep) {
      await pRow.delete()
    }
  })
}
