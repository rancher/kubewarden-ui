import { Locator, Page, expect } from '@playwright/test'
import { RancherUI, YAMLPatch } from '../components/rancher-ui'
import { TableRow } from '../components/table-row'
import { step } from '../rancher/rancher-test'
import { BasePage } from '../rancher/basepage'

export const apList = ['Custom Policy',
  'Affinity Node Selector', 'Allow Privilege Escalation PSP', 'Allowed Fs Groups PSP', 'Allowed Proc Mount Types PSP', 'Apparmor PSP', 'Bucket Approved Region', 'Bucket Endpoint Domain',
  'Bucket Insecure Connections', 'Capabilities PSP', 'CEL Policy', 'Container Block Sysctls', 'Container Block Sysctls CVE-2022-0811', 'Container Resources', 'Container Running As Root',
  'Container Running As User', 'Containers Block Ssh Port', 'Containers Block Specific Image Names', 'Containers Missing Security Context', 'Containers Should Not Run In Namespace',
  'Deprecated API Versions', 'Disallow Service Loadbalancer', 'Disallow Service Nodeport', 'Do not expose admission controller webhook services', 'Echo', 'Environment Variable Policy',
  'Environment Variable Secrets Scanner', 'Flexvolume Drivers Psp', 'GitRepository Ignore Suffixes', 'GitRepository Organization Domains', 'GitRepository Specific Branch',
  'GitRepository Untrusted Domains', 'Helm Release Max History', 'Helm Release Namespace Match', 'Helm Release Post Renderer', 'Helm Release Remediation Retries',
  'Helm Release Rollback Should Be Disabled', 'Helm Release Service Account Name', 'Helm Release Storage Namespace', 'Helm Release Target Namespace', 'Helm Release Values From',
  'Helm Repo Type Should Be OCI', 'Helm Repo URL Should Be in Organisation Domain', 'HelmChart Cosign Verification', 'HelmChart Values File Format', 'Host Namespaces PSP',
  'Hostpaths PSP', 'Ingress Policy', 'Istio Gateway Approved Hosts', 'Kustomization Decryption Provider', 'Kustomization Excluded Paths', 'Kustomization Image Tag Standards',
  'Kustomization Images Requirement', 'Kustomization Patches', 'Kustomization Prune', 'Kustomization Target Namespace', 'Kustomization Var Substitution',
  'Metadata Missing Label And Value', 'Missing Kubernetes App Component Label', 'Missing Kubernetes App Created By Label', 'Missing Kubernetes App Instance Label',
  'Missing Kubernetes App Label', 'Missing Kubernetes App Managed By Label', 'Missing Kubernetes App Part Of Label', 'Missing Kubernetes App Version Label',
  'Missing Owner Label', 'Namespace Pod Quota', 'Namespace Resources Limitrange', 'Namespace label propagator', 'Network Allow Egress Traffic From Namespace To Another',
  'Network Allow Ingress Traffic From Namespace To Another', 'Network Block All Ingress Traffic To Namespace From CIDR Block', 'OCIRepository Cosign Verification',
  'OCIRepository Ignore Suffixes', 'OCIRepository Layer Selector', 'OCIRepository Not Latest Tag', 'OCIRepository Organization Domains', 'OCIRepository Patch Annotation',
  'PVC StorageClass Validator', 'Persistent Volume Claim Snapshot', 'Pod Privileged Policy', 'Pod Runtime', 'Pod ndots', 'Priority class policy', 'Rbac Prohibit List On Secrets',
  'Rbac Prohibit Watch On Secrets', 'Rbac Prohibit Wildcard On Secrets', 'Rbac Prohibit Wildcards on Policy Rule Resources', 'Rbac Prohibit Wildcards on Policy Rule Verbs',
  'Readonly Root Filesystem PSP', 'Resource Quota Setting Is Missing', 'Resource Reconcile Interval Must Be Set Between Lower and Upper Bound', 'Resource Suspend Waiver',
  'Safe Annotations', 'Safe Labels', 'Seccomp PSP', 'Selinux PSP', 'Share PID namespace', 'Sysctl PSP', 'Trusted Repos', 'Unique Ingress host', 'Unique service selector',
  'User Group PSP', 'Verify Image Signatures', 'Volumes PSP', 'volumeMounts', 'High Risk Service Account', 'Annotations', 'Labels'] as const

export const capList = [...apList, 'PSA Label Enforcer', 'Istio Injected Namespaces', 'Persistent Volume Access Modes'] as const

export type policyTitle = typeof capList[number]
export type PolicyKind = 'AdmissionPolicy' | 'ClusterAdmissionPolicy'

export interface Policy {
  title           : policyTitle
  name            : string
  mode?           : 'Monitor' | 'Protect'
  audit?          : 'On' | 'Off'
  server?         : string
  module?         : string // Custom Policy specific
  namespace?      : string // AdmissionPolicy specific
  ignoreRancherNS?: boolean // ClusterAdmissionAdmissionPolicy specific
  settings?(ui: RancherUI): Promise<void>
  matchConditions?: string
  yamlPatch?      : YAMLPatch
}

/**
 * Return policy with generated name
 */
export const generateName = (policy: Omit<Policy, 'name'>): Policy => {
  const defaultName = `generated-${policy.title.replace(/\s+/g, '-').toLowerCase()}`
  return { name: defaultName, ...policy }
}

export abstract class BasePolicyPage extends BasePage {
  abstract kind: PolicyKind
  readonly name      : Locator
  readonly module    : Locator
  readonly server    : Locator
  readonly namespace : Locator
  readonly modeGroup : Locator
  readonly auditGroup: Locator
  readonly readme    : Locator

  constructor(page: Page) {
    super(page)
    this.name = this.ui.input('Name*')
    this.module = this.ui.input('Module*')
    this.server = this.ui.select('Policy Server')
    this.namespace = this.ui.select('Namespace*')
    this.modeGroup = this.ui.radioGroup('Mode')
    this.auditGroup = this.ui.radioGroup('Background Audit')
    this.readme = page.locator('div.policy-info-content')
  }

  cards = (options?: { name?: policyTitle, official?: boolean, aware?: boolean, mutation?: boolean }): Locator => {
    let cards = options?.name
      ? this.ui.tableRow(options.name).row
      : this.page.locator('table.sortable-table > tbody:visible').locator('tr.main-row')

    const optionMap: Partial<Record<keyof NonNullable<typeof options>, Locator>> = {
      official: this.page.getByAltText('Official Rancher Policy'),
      aware   : this.page.getByText('Context Aware'),
      mutation: this.page.getByText('Mutation'),
    }
    for (const o in optionMap) {
      if (options && options[o] !== undefined) {
        cards = options[o] ? cards.filter({ has: optionMap[o] }) : cards.filter({ hasNot: optionMap[o] })
      }
    }
    return cards
  }

  mode(mode: 'Monitor' | 'Protect'): Locator {
    return this.modeGroup.getByRole('radio', { name: mode })
  }

  audit(state: 'On' | 'Off'): Locator {
    return this.auditGroup.getByRole('radio', { name: state })
  }

  async selectTab(name: 'General' | 'Rules' | 'Settings' | 'Namespace Selector' | 'Match Conditions' | 'Context Aware Resources') {
    await this.ui.tab(name).click()
    await expect(this.page.locator('.tab-header').getByRole('heading', { name })).toBeVisible()
  }

  async setName(name: string) {
    await this.name.fill(name)
  }

  async setServer(server: string) {
    await this.ui.selectOption('Policy Server', server)
  }

  async setModule(module: string) {
    await this.module.fill(module)
  }

  async setMode(mode: 'Monitor' | 'Protect') {
    await this.mode(mode).check()
  }

  async setBackgroundAudit(state: 'On' | 'Off') {
    await this.audit(state).check()
  }

  // Get number of policies from pagination: 1 - 100 of 105 Items
  async policyCount(): Promise<number> {
    const paging = await this.page.locator('div.paging').getByText(/[0-9]+ of [0-9]+ Items/).textContent() || 'Error'
    return parseInt(paging.split('of ')[1])
  }

  @step
  async open(p: Policy, options?: { navigate?: boolean }) {
    if (options?.navigate !== false) {
      await this.goto()
      await this.ui.button('Create').click()
    }

    // Open requested policy
    if (p.title === 'Custom Policy') {
      await this.ui.button('Create Custom Policy').click()
    } else {
      // Filter policy in case it's hidden by pagination
      await this.ui.input('Filter').fill(p.title.split(' ')[0])
      await this.ui.tableRow(p.title).row.click()
    }
    // Check we are on policy creation page
    const wizard = this.page.getByTestId('kw-policy-create-wizard')
    await expect(wizard.getByRole('heading', { name: p.title })).toBeVisible()
    await expect(wizard.getByRole('heading', { name: 'General' })).toBeVisible()
  }

  async setValues(p: Policy) {
    // Fill general values
    if (p.name !== undefined) await this.setName(p.name)
    if (p.server !== undefined) await this.setServer(p.server)
    if (p.module !== undefined) await this.setModule(p.module)
    if (p.mode) await this.setMode(p.mode)
    if (p.audit) await this.setBackgroundAudit(p.audit)
    // Extra policy settings
    if (p.settings) {
      await this.selectTab('Settings')
      await p.settings(this.ui)
      // Wait for generated fields
      await this.page.waitForTimeout(200)
    }
    if (p.matchConditions) {
      await this.selectTab('Match Conditions')
      await this.ui.button('Add Match Condition').click()
      await this.ui.input('Name*').fill('con1')
      await this.ui.editYaml(p.matchConditions)
    }
    if (p.yamlPatch) {
      await this.ui.openView('Edit YAML')
      await this.ui.editYaml(p.yamlPatch)
    }
  }

  @step
  async updateToProtect(row: TableRow) {
    await row.action('Update Mode')
    await this.ui.checkbox('Update to Protect Mode').check()
    await this.ui.button('Save').click()
    await expect(row.column('Mode')).toHaveText('Protect')
  }

  @step
  async create(p: Policy, options?: { wait?: boolean, navigate?: boolean }): Promise<TableRow> {
    await this.open(p, options)
    await this.setValues(p)

    // Create policy - redirects to policies list
    await this.ui.button('Finish').click()
    await expect(this.page).toHaveURL(/.*admissionpolicy$/)
    // Check new policy
    const polRow = await this.ui.tableRow(p.name).waitFor()
    if (options?.wait) {
      await polRow.toBeActive()
      // Prevent occasional wrong resource version error on follow-up tests
      await this.page.waitForTimeout(2_000)
    }
    return polRow
  }

  async delete(policy: string | TableRow) {
    await this.goto()
    if (typeof policy === 'string') policy = this.ui.tableRow(policy)
    await policy.delete()
  }
}

export class AdmissionPoliciesPage extends BasePolicyPage {
  kind: PolicyKind = 'AdmissionPolicy'

  async goto(): Promise<void> {
    await this.nav.apolicies()
  }

  async setNamespace(name: string) {
    await this.ui.selectOption('Namespace*', /^Create a [nN]ew Namespace$/)
    await this.ui.input('Namespace*').fill(name)
  }

  @step
  async setValues(p: Policy) {
    if (p.namespace !== undefined) {
      await this.setNamespace(p.namespace)
    }
    await super.setValues(p)
  }
}

export class ClusterAdmissionPoliciesPage extends BasePolicyPage {
  kind: PolicyKind = 'ClusterAdmissionPolicy'

  async goto(): Promise<void> {
    await this.nav.capolicies()
  }

  async setIgnoreRancherNS(checked: boolean) {
    await this.ui.checkbox('Ignore Rancher Namespaces').setChecked(checked)
  }

  @step
  async setValues(p: Policy) {
    if (p.ignoreRancherNS) {
      await this.setIgnoreRancherNS(p.ignoreRancherNS)
    }
    await super.setValues(p)
  }
}
