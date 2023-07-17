import { expect } from '@playwright/test';
import { BasePage } from './basepage';
import { RancherUI } from './rancher-ui';
import type { Locator, Page } from '@playwright/test';
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

  async selectTab(name: 'General'|'Rules'|'Settings'|'Context Aware Resources') {
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
    await this.page.getByRole('heading', {name:'Mode'}).locator('xpath=../..').getByRole('radio', {name: mode}).check()
  }

  async setIgnoreRancherNS(option: 'Yes' | 'No' | boolean) {
    if (typeof option == 'boolean')
      option = option ? 'Yes' : 'No'
    await this.page.getByRole('heading', {name:'Ignore Rancher'}).locator('xpath=../..').getByRole('radio', {name: option}).check()
  }

  async open(p: Policy) {
    // Start from policies list
    await this.ui.createBtn.click()
    await expect(this.page.getByRole('heading', { name: 'Finish: Step 1' })).toBeVisible()

    // Select policy, skip readme
    await this.page.getByRole('heading', { name: p.title, exact: true }).click()
    await this.page.getByRole('tab', { name: 'Values' }).click()
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
      // Give generated fields time to get registered
      await this.ui.page.waitForTimeout(200)
      // Show yaml with edited settings
      await this.page.getByRole('button', { name: 'Edit YAML' }).click()
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
    await expect(polRow.row).toBeVisible()
    if (options?.wait) {
      await expect(polRow.column('Status')).toHaveText('Active', {timeout: 200_000})
    }
    return polRow
  }

}
