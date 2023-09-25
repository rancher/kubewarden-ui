import { expect } from '@playwright/test';
import { BasePage } from './basepage';
import { RancherUI } from './rancher-ui';
import { TableRow } from '../components/table-row';

export const policyTitles = ['Custom Policy', 'Allow Privilege Escalation PSP', 'Allowed Fs Groups PSP', 'Allowed Proc Mount Types PSP', 'Apparmor PSP', 'Capabilities PSP',
  'Deprecated API Versions', 'Disallow Service Loadbalancer', 'Disallow Service Nodeport', 'Echo', 'Environment Variable Secrets Scanner', 'Environment Variable Policy', 'Flexvolume Drivers Psp',
  'Host Namespaces PSP', 'Hostpaths PSP', 'Ingress Policy', 'Namespace label propagator', 'Pod Privileged Policy', 'Pod Runtime', 'PSA Label Enforcer', 'Readonly Root Filesystem PSP',
  'Safe Annotations', 'Safe Labels', 'Seccomp PSP', 'Selinux PSP', 'Sysctl PSP', 'Trusted Repos', 'User Group PSP', 'Verify Image Signatures', 'volumeMounts', 'Volumes PSP'] as const

export interface Policy {
  title: typeof policyTitles[number]
  name?: string
  mode?: 'Monitor'|'Protect'
  server?: string
  module?: string
  namespace?: string        // AdmissionPolicy specific
  ignoreRancherNS?: boolean // ClusterAdmissionAdmissionPolicy specific
  settings?(ui: RancherUI): Promise<void>
}

export function generateName(title: string) {
  return 'test-' + title.replace(/\s+/g, '-').toLowerCase()
}

export class BasePolicyPage extends BasePage {

  async selectTab(name: 'General'|'Rules'|'Settings'|'Namespace Selector'|'Context Aware Resources') {
    await this.page.getByRole('tab', { name: name, exact: true }).click()
    await expect(this.page.locator('.tab-header').getByRole('heading', {name: name})).toBeVisible()
  }

  async setName(name: string) {
    await this.ui.input('Name*').fill(name)
  }

  async setServer(server: string) {
    await this.ui.select('Policy Server', server)
  }

  async setModule(module: string) {
    await this.ui.input('Module*').fill(module)
  }

  async setNamespace(namespace: string) {
    await this.ui.select('Namespace*', namespace)
  }

  async setMode(mode: 'Monitor' | 'Protect') {
    await this.ui.radio('Mode', mode).check()
  }

  async setIgnoreRancherNS(checked: boolean) {
    await this.ui.checkbox('Ignore Rancher Namespaces').setChecked(checked)
  }

  async editYaml() {
      // Give generated fields time to get registered
      await this.page.waitForTimeout(200)
      // Show yaml with edited settings
      await this.page.getByRole('button', { name: 'Edit YAML' }).click()
      await expect(this.page.getByTestId('kw-policy-config-yaml-editor')).toBeVisible()
  }

  async open(p: Policy) {
    // Open list of policies
    await this.ui.createBtn.click()
    await expect(this.page.getByRole('heading', { name: 'Finish: Step 1' })).toBeVisible()
    // Open requested policy
    await this.ui.withReload(async () => {
      await this.page.getByRole('heading', { name: p.title, exact: true }).click()
    }, 'Could not get policy list from artifacthub')
    // Go to values tab, skip optional readme
    await this.page.getByRole('tab', { name: 'Values' }).click()
    await expect(this.page.getByRole('heading', { name: 'General' })).toBeVisible()
  }

  async setValues(p: Policy) {
    // Fill general values
    if (p.name != null) await this.setName(p.name)
    if (p.server != null) await this.setServer(p.server)
    if (p.mode) await this.setMode(p.mode)
    if (p.module != null) await this.setModule(p.module)

    // Fill Admission | ClusterAdmission specific fields
    if ('namespace' in p && p.namespace != null)
      await this.setNamespace(p.namespace)
    if ('ignoreRancherNS' in p && p.ignoreRancherNS)
      await this.setIgnoreRancherNS(p.ignoreRancherNS)

    // Extra policy settings
    if (p.settings) {
      await p.settings(this.ui)
      await this.editYaml()
    }
  }

  async updateToProtect(row: TableRow) {
    await row.action('Update Mode')
    await this.ui.checkbox('Update to Protect Mode').check()
    await this.page.getByRole('button', {name: 'Save', exact: true}).click()
    await expect(row.column('Mode')).toHaveText('Protect')
  }

  async create(p: Policy, options?: { wait: boolean}) {
    p.name ??= generateName(p.title)
    await this.open(p)
    await this.setValues(p)

    // Create policy - redirects to policies list
    await this.page.getByRole('button', { name: 'Finish' }).click()
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

}
