import { test } from './rancher/rancher-test'
import type { RancherUI } from './components/rancher-ui'
import { Policy, policyTitle, capList, generateName, ClusterAdmissionPoliciesPage } from './pages/policies.page'
import { PolicyServersPage } from './pages/policyservers.page'

test.describe.configure({ mode: 'parallel' })

const polmode = 'Monitor'
const pserver = { name: process.env.CI ? 'allpolicies-pserver' : 'default' }
const polkeep = !!process.env.keep || false

type PolicySettings = {
  settings?: (ui: RancherUI) => Promise<void>
  skip?    : string
}

const policySettingsMap: Partial<Record<policyTitle, PolicySettings>> = {
  'Custom Policy'              : { settings: setupCustomPolicy },
  'Deprecated API Versions'    : { settings: setupDeprecatedAPIVersions },
  'Environment Variable Policy': { settings: setupEnvironmentVariablePolicy },
  'Namespace label propagator' : { settings: setupNamespaceLabelPropagator },
  'PSA Label Enforcer'         : { settings: setupPSALabelEnforcer },
  'Selinux PSP'                : { settings: setupSelinuxPSP },
  'Trusted Repos'              : { settings: setupTrustedRepos },
  'User Group PSP'             : { settings: setupUserGroupPSP },
  'Verify Image Signatures'    : { settings: setupVerifyImageSignatures },
  'Container Resources'        : { settings: setupContainerResources },
  'PVC StorageClass Validator' : { settings: setupPvcScValidator },
  'CEL Policy'                 : { skip: 'https://github.com/kubewarden/cel-policy/issues/12' },
  'volumeMounts'               : { settings: setupVolumeMounts },
}

async function setupPvcScValidator(ui: RancherUI) {
  await ui.button('Add').click()
  await ui.page.getByPlaceholder('e.g. bar').fill('denyname')
}

async function setupContainerResources(ui: RancherUI) {
  await ui.input('Default CPU requested').fill('100m')
  await ui.input('Default CPU limit').fill('200m')
  await ui.input('Max CPU limit allowed').fill('500m')
}

async function setupTrustedRepos(ui: RancherUI) {
  await ui.button('Add').first().click()
  await ui.page.getByRole('textbox').last().fill('registry.my-corp.com')
}

async function setupNamespaceLabelPropagator(ui: RancherUI) {
  await ui.button('Add').click()
  await ui.page.getByRole('textbox').last().fill('cost-center')
}

async function setupPSALabelEnforcer(ui: RancherUI) {
  await ui.selectOption('Enforce', 'baseline')
}

async function setupCustomPolicy(ui: RancherUI) {
  await ui.tab('General').click()
  await ui.input('Module*').fill('ghcr.io/kubewarden/policies/pod-privileged:v0.2.5')

  await ui.tab('Rules').click()
  await ui.selectOption('Resource type*', 'pods')
  await ui.selectOption('API Versions*', 'v1')
  await ui.selectOption('Operation type*', 'CREATE')
}

async function setupVolumeMounts(ui: RancherUI) {
  await ui.selectOption('Reject', 'anyIn')
  await ui.button('Add').click()
  await ui.page.getByPlaceholder('e.g. bar').fill('/nomount')
}

async function setupSelinuxPSP(ui: RancherUI) {
  await ui.selectOption('SE Linux Options', 'RunAsAny')
}

async function setupDeprecatedAPIVersions(ui: RancherUI) {
  await ui.input('Kubernetes Version*').fill('v1.24.9+k3s2')
}

async function setupVerifyImageSignatures(ui: RancherUI) {
  await ui.selectOption('Signature Type', 'GithubAction')
  await ui.button('Add').click()
  await ui.input('Image*').fill('ghcr.io/kubewarden/*')
  await ui.editYaml((y) => {
    y.githubActions.owner = 'kubewarden'
  })
}

async function setupEnvironmentVariablePolicy(ui: RancherUI) {
  await ui.button('Add').click()
  await ui.selectOption('Reject Operator', 'anyIn')
  await ui.editYaml((y) => {
    y.environmentVariables[0].name = 'novar'
  })
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
for (const title of capList) {
  test(`install: ${title}`, async({ page }) => {
    const { settings, skip } = policySettingsMap[title] || {}
    // Skip broken policies
    test.fixme(!!skip, skip)

    const p: Policy = generateName({
      title,
      server: pserver.name,
      mode  : polmode,
      settings
    })

    const capPage = new ClusterAdmissionPoliciesPage(page)
    const pRow = await capPage.create(p, { wait: !polkeep })
    if (!polkeep) {
      await pRow.delete()
    }
  })
}
