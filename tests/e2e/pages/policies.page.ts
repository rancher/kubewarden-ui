import { Locator, Page, expect } from '@playwright/test'
import { RancherUI, YAMLPatch } from '../components/rancher-ui'
import { TableRow } from '../components/table-row'
import { step } from '../rancher/rancher-test'
import { BasePage } from '../rancher/basepage'

export const apList = ['Custom Policy', 'Allow Privilege Escalation PSP', 'Allowed Fs Groups PSP', 'Allowed Proc Mount Types PSP', 'Apparmor PSP', 'Capabilities PSP', 'Container Resources',
  'Deprecated API Versions', 'Disallow Service Loadbalancer', 'Disallow Service Nodeport', 'Echo', 'Environment Variable Secrets Scanner', 'Environment Variable Policy', 'Flexvolume Drivers Psp',
  'Host Namespaces PSP', 'Hostpaths PSP', 'Ingress Policy', 'Namespace label propagator', 'Pod Privileged Policy', 'Pod Runtime', 'Readonly Root Filesystem PSP', 'Share PID namespace',
  'Safe Annotations', 'Safe Labels', 'Seccomp PSP', 'Selinux PSP', 'Sysctl PSP', 'Trusted Repos', 'User Group PSP', 'Verify Image Signatures', 'volumeMounts', 'Volumes PSP', 'Unique Ingress host',
  'Unique service selector', 'PVC StorageClass Validator', 'CEL Policy', 'Pod ndots', 'Do not expose admission controller webhook services', 'Priority class policy'] as const

export const capList = [...apList, 'PSA Label Enforcer'] as const

export type policyTitle = typeof capList[number]
export type PolicyKind = 'AdmissionPolicy' | 'ClusterAdmissionPolicy'

export interface Policy {
    title: policyTitle
    name: string
    mode?: 'Monitor' | 'Protect'
    audit?: 'On' | 'Off'
    server?: string
    module?: string // Custom Policy specific
    namespace?: string // AdmissionPolicy specific
    ignoreRancherNS?: boolean // ClusterAdmissionAdmissionPolicy specific
    settings?(ui: RancherUI): Promise<void>
    yamlPatch?: YAMLPatch
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
    readonly name: Locator;
    readonly module: Locator;
    readonly server: Locator;
    readonly namespace: Locator;
    readonly modeGroup: Locator;
    readonly auditGroup: Locator;
    readonly readme: Locator;

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

    cards = (options?: {name?: policyTitle, signed?: boolean, official?: boolean, aware?: boolean, mutation?: boolean }): Locator => {
      let cards = options?.name
        ? this.ui.tableRow(options.name).row
        : this.page.locator('table.sortable-table > tbody:visible').locator('tr.main-row')

      const optionMap: Partial<Record<keyof NonNullable<typeof options>, Locator>> = {
        signed  : this.page.locator('div.badge__signed').locator('i.icon-lock'),
        official: this.page.locator('div.badge__icon').getByAltText('Official Kubewarden Policy'),
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

    async selectTab(name: 'General' | 'Rules' | 'Settings' | 'Namespace Selector' | 'Context Aware Resources') {
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

    async whitelist() {
      await expect(this.page.getByText('Official Kubewarden policies are hosted on ArtifactHub')).toBeVisible()
      await this.ui.button('Add ArtifactHub To Whitelist').click()
    }

    // ArtifactHub error: https://github.com/kubewarden/kubewarden-controller/issues/911#issuecomment-2426954817
    async handleRateLimitError() {
      await this.ui.retry(async()=> {
        await expect(this.cards({official:true, signed:true}).first()).toBeVisible({ timeout: 80_000 })
      }, 'Artifact Hub: 429 Too Many Requests')
    }

    @step
    async open(p: Policy, options?: { navigate?: boolean }) {
      if (options?.navigate !== false) {
        await this.goto()
        await this.ui.button('Create').click()
      }

      // Open requested policy
      await this.handleRateLimitError()
      if (p.title === 'Custom Policy') {
        await this.ui.button('Create Custom Policy').click()
      } else {
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
    kind: PolicyKind = 'AdmissionPolicy';

    async goto(): Promise<void> {
      await this.nav.explorer('Kubewarden', 'AdmissionPolicies')
      // await this.nav.goto('dashboard/c/local/kubewarden/policies.kubewarden.io.admissionpolicy')
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
      await this.nav.explorer('Kubewarden', 'ClusterAdmissionPolicies')
      // await this.nav.goto('dashboard/c/local/kubewarden/policies.kubewarden.io.clusteradmissionpolicy')
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
