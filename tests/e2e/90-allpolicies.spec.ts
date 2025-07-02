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
  'Custom Policy'                                                        : { settings: setupCustomPolicy },
  'Affinity Node Selector'                                               : { settings: affinityNodeSelector },
  'Bucket Approved Region'                                               : { settings: generalArray },
  'Bucket Endpoint Domain'                                               : { settings: generalArray },
  'CEL Policy'                                                           : { skip: 'https://github.com/kubewarden/cel-policy/issues/12' },
  'Container Resources'                                                  : { settings: setupContainerResources },
  'Containers Block Specific Image Names'                                : { settings: generalArray },
  'Deprecated API Versions'                                              : { settings: setupDeprecatedAPIVersions },
  'Environment Variable Policy'                                          : { settings: generalArray },
  'GitRepository Ignore Suffixes'                                        : { settings: generalArray },
  'GitRepository Organization Domains'                                   : { settings: generalArray },
  'GitRepository Specific Branch'                                        : { settings: gitRepositorySpecificBranch },
  'GitRepository Untrusted Domains'                                      : { settings: generalArray },
  'Helm Release Service Account Name'                                    : { settings: generalArray },
  'Helm Release Storage Namespace'                                       : { settings: generalArray },
  'Helm Release Target Namespace'                                        : { settings: generalArray },
  'Helm Release Values From'                                             : { settings: generalArray },
  'Helm Repo URL Should Be in Organisation Domain'                       : { settings: generalArray },
  'Istio Gateway Approved Hosts'                                         : { settings: generalArray },
  'Istio Injected Namespaces'                                            : { settings: generalArray },
  'Kustomization Decryption Provider'                                    : { settings: generalArray },
  'Kustomization Excluded Paths'                                         : { settings: generalArray },
  'Kustomization Images Requirement'                                     : { skip: 'https://github.com/rancher/kubewarden-ui/pull/1250' },
  'Kustomization Patches'                                                : { skip: 'https://github.com/rancher/kubewarden-ui/pull/1250', settings: kustomizationPatches },
  'Kustomization Prune'                                                  : { skip: 'https://github.com/rancher/kubewarden-ui/pull/1250', settings: kustomizationPrune },
  'Kustomization Target Namespace'                                       : { settings: generalArray },
  'Metadata Missing Label And Value'                                     : { settings: metadataMissingLabelAndValue },
  'Namespace Resources Limitrange'                                       : { settings: namespaceResourcesLimitrange },
  'Namespace label propagator'                                           : { settings: generalArray },
  'Network Allow Egress Traffic From Namespace To Another'               : { settings: networkAllowTrafficFromNamespaceToAnother },
  'Network Allow Ingress Traffic From Namespace To Another'              : { settings: networkAllowTrafficFromNamespaceToAnother },
  'Network Block All Ingress Traffic To Namespace From CIDR Block'       : { settings: networkBlockAllIngressTrafficToNamespaceFromCIDRBlock },
  'OCIRepository Ignore Suffixes'                                        : { settings: generalArray },
  'OCIRepository Layer Selector'                                         : { settings: ociRepositoryLayerSelector },
  'OCIRepository Organization Domains'                                   : { settings: generalArray },
  'OCIRepository Patch Annotation'                                       : { settings: ociRepositoryPatchAnnotation },
  'PSA Label Enforcer'                                                   : { settings: setupPSALabelEnforcer },
  'PVC StorageClass Validator'                                           : { settings: generalArray },
  'Persistent Volume Access Modes'                                       : { settings: persistentVolumeAccessModes },
  'Persistent Volume Claim Snapshot'                                     : { settings: persistentVolumeClaimSnapshot },
  'Priority class policy'                                                : { settings: generalArray },
  'Resource Quota Setting Is Missing'                                    : { settings: resourceQuotaSettingIsMissing },
  'Resource Suspend Waiver'                                              : { settings: generalArray },
  'Selinux PSP'                                                          : { settings: setupSelinuxPSP },
  'Trusted Repos'                                                        : { settings: setupTrustedRepos },
  'User Group PSP'                                                       : { settings: setupUserGroupPSP },
  'Verify Image Signatures'                                              : { settings: setupVerifyImageSignatures },
  'volumeMounts'                                                         : { settings: setupVolumeMounts },
  'Rbac Prohibit Wildcards on Policy Rule Resources'                     : { skip: 'https://github.com/kubewarden/rego-policies-library/pull/54' },
  'Rbac Prohibit Wildcards on Policy Rule Verbs'                         : { skip: 'https://github.com/kubewarden/rego-policies-library/pull/54' },
  'Containers Block Ssh Port'                                            : { skip: 'https://github.com/rancher/kubewarden-ui/pull/1250' },
  'Container Running As User'                                            : { skip: 'https://github.com/rancher/kubewarden-ui/pull/1250' },
  'Helm Release Max History'                                             : { skip: 'https://github.com/rancher/kubewarden-ui/pull/1250' },
  'Helm Release Remediation Retries'                                     : { skip: 'https://github.com/rancher/kubewarden-ui/pull/1250' },
  'Resource Reconcile Interval Must Be Set Between Lower and Upper Bound': { skip: 'https://github.com/rancher/kubewarden-ui/pull/1250' },
  'Namespace Pod Quota'                                                  : { skip: 'https://github.com/rancher/kubewarden-ui/pull/1250' },
}

async function generalArray(ui: RancherUI) {
  await ui.button('Add').click()
  await ui.page.getByPlaceholder('e.g. bar').fill('item')
}

async function affinityNodeSelector(ui: RancherUI) {
  await ui.input('Key*').fill('node-role.kubernetes.io/control-plane')
  await ui.input('Value*').fill('true')
}

async function metadataMissingLabelAndValue(ui: RancherUI) {
  await ui.input('Label*').fill('req-label')
  await ui.input('Value*').fill('req-value')
}

async function gitRepositorySpecificBranch(ui: RancherUI) {
  await ui.input('Branch*').fill('main')
}

async function namespaceResourcesLimitrange(ui: RancherUI) {
  await ui.input('Resource type*').fill('cpu')
  await ui.input('Resource setting*').fill('default')
}

async function networkAllowTrafficFromNamespaceToAnother(ui: RancherUI) {
  await ui.input('Src namespace*').fill('default')
  await ui.input('Dst namespace*').fill('kube-system')
}

async function networkBlockAllIngressTrafficToNamespaceFromCIDRBlock(ui: RancherUI) {
  await ui.input('Namespace*').fill('default')
  await ui.input('Cidr*').fill('cidr')
}

async function ociRepositoryLayerSelector(ui: RancherUI) {
  await ui.button('Add').first().click()
  await ui.page.getByRole('textbox').first().fill('registry.my-corp.com')
  await ui.button('Add').last().click()
  await ui.page.getByRole('textbox').last().fill('registry.my-corp.com')
}

async function ociRepositoryPatchAnnotation(ui: RancherUI) {
  await ui.input('Provider*').fill('provider')
}

async function persistentVolumeClaimSnapshot(ui: RancherUI) {
  await ui.input('Snapshot class*').fill('snapshot-class')
  await ui.input('Pvc name*').fill('pvc-name')
}

async function resourceQuotaSettingIsMissing(ui: RancherUI) {
  await ui.input('Resource type*').fill('cpu')
}

async function kustomizationPatches(ui: RancherUI) {
  await ui.checkbox('Patches required').check()
}

async function kustomizationPrune(ui: RancherUI) {
  await ui.checkbox('Prune').check()
}

async function persistentVolumeAccessModes(ui: RancherUI) {
  await ui.input('Name*').fill('pvname')
  await ui.input('Access mode*').fill('readWriteOnce')
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

async function setupUserGroupPSP(ui: RancherUI) {
  for (const rule of await ui.select('Rule').all()) {
    await ui.selectOption(rule, 'RunAsAny')
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
