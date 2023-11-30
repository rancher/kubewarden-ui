import { Locator, Page, expect } from '@playwright/test'
import { RancherUI, YAMLPatch } from '../components/rancher-ui'
import { TableRow } from '../components/table-row'
import { step } from '../rancher-test'
import { BasePage } from './basepage'

export const apList = ['Custom Policy', 'Allow Privilege Escalation PSP', 'Allowed Fs Groups PSP', 'Allowed Proc Mount Types PSP', 'Apparmor PSP', 'Capabilities PSP',
  'Deprecated API Versions', 'Disallow Service Loadbalancer', 'Disallow Service Nodeport', 'Echo', 'Environment Variable Secrets Scanner', 'Environment Variable Policy', 'Flexvolume Drivers Psp',
  'Host Namespaces PSP', 'Hostpaths PSP', 'Ingress Policy', 'Namespace label propagator', 'Pod Privileged Policy', 'Pod Runtime', 'Readonly Root Filesystem PSP',
  'Safe Annotations', 'Safe Labels', 'Seccomp PSP', 'Selinux PSP', 'Sysctl PSP', 'Trusted Repos', 'User Group PSP', 'Verify Image Signatures', 'volumeMounts', 'Volumes PSP', 'Unique Ingress host'] as const

export const capList = [...apList, 'PSA Label Enforcer']

export type policyTitle = typeof capList[number]
export type PolicyKind = 'AdmissionPolicy' | 'ClusterAdmissionPolicy'

export interface Policy {
    title: policyTitle
    name: string
    mode?: 'Monitor' | 'Protect'
    audit?: 'On' | 'Off'
    server?: string
    module?: string
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

    constructor(page: Page) {
      super(page)
      this.name = this.ui.input('Name*')
      this.module = this.ui.input('Module*')
      this.server = this.ui.combobox('Policy Server')
      this.namespace = this.ui.combobox('Namespace*')
      this.modeGroup = this.ui.radioGroup('Mode')
      this.auditGroup = this.ui.radioGroup('Background Audit')
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
      await this.ui.select('Policy Server', server)
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

    @step
    async open(p: Policy, options?: { navigate?: boolean }) {
      if (options?.navigate !== false) {
        await this.goto()
        await this.ui.button('Create').click()
      }
      await expect(this.page.getByRole('heading', { name: 'Finish: Step 1' })).toBeVisible()
      // Open requested policy
      await this.ui.withReload(async() => {
        await this.page.getByRole('heading', { name: p.title, exact: true }).click()
      }, 'Could not get policy list from artifacthub')
      // Go to values tab, skip optional readme
      await this.page.getByRole('tab', { name: 'Values' }).click()
      await expect(this.page.getByRole('heading', { name: 'General' })).toBeVisible()
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
      const polRow = this.ui.getRow(p.name)
      await polRow.toBeVisible()
      if (options?.wait) {
        await polRow.toBeActive()
        // Prevent occasional wrong resource version error on follow-up tests
        await this.page.waitForTimeout(2_000)
      }
      return polRow
    }

    async delete(policy: string | TableRow) {
      await this.goto()
      if (typeof policy === 'string') policy = this.ui.getRow(policy)
      await policy.delete()
    }
}

export class AdmissionPoliciesPage extends BasePolicyPage {
    kind: PolicyKind = 'AdmissionPolicy';

    async goto(): Promise<void> {
      await this.nav.explorer('Kubewarden', 'AdmissionPolicies')
      // await this.page.goto('dashboard/c/local/kubewarden/policies.kubewarden.io.admissionpolicy')
    }

    async setNamespace(name: string) {
      await this.ui.select('Namespace*', /^Create a [nN]ew Namespace$/)
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
      // await this.page.goto('dashboard/c/local/kubewarden/policies.kubewarden.io.clusteradmissionpolicy')
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
