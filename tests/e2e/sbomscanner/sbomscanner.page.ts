import { expect } from '@playwright/test'
import { RancherAppsPage } from '../rancher/rancher-apps.page'
import { BasePage } from '../rancher/basepage'
import { step } from '../rancher/rancher-test'

export interface Registry {
  name         : string
  uri          : string
  type?        : 'OCI Distribution' | 'No Catalog'
  namespace?   : string
  repositories?: string[]
}

export interface VexHub {
  name    : string
  uri     : string
  enabled?: boolean
}

export interface WorkloadScanConfig {
  enabled?: boolean
  rules?  : { key: string, value: string }[]
}

export class SbomScannerPage extends BasePage {
  async goto(): Promise<void> {
    await this.nav.sbomScanner()
  }

  @step
  async install(options?: { version?: string }) {
    const appsPage = new RancherAppsPage(this.page)
    // Requirements Dialog
    const welcomeStep = this.page.getByText('Get a comprehensive view of your container image vulnerabilities and focus on risks that truly matter.')
    const addCNPGRepoStep = this.page.getByRole('heading', { name: 'Add the CNPG Helm repository', exact: true })
    const addSBOMRepoStep = this.page.getByRole('heading', { name: 'Add the SBOMScanner Helm repository', exact: true })
    const installCNPGStep = this.page.getByRole('heading', { name: 'Installation for CloudNativePG', exact: true })
    const installSBOMStep = this.page.getByRole('heading', { name: 'Installation for SBOMScanner', exact: true })

    await this.goto()

    // We need to skip some steps if kubewarden is already installed
    await this.page.waitForTimeout(2000) // Ignore briefly visible welcome step
    await expect(welcomeStep.or(addCNPGRepoStep)).toBeVisible()
    const freshInstall = (await welcomeStep.isVisible())

    // Welcome screen
    if (freshInstall) {
      // await expect(welcomeStep).toBeVisible()
      await this.ui.button('Start installation').click()
    }

    // Add CNPG repository
    await expect(addCNPGRepoStep).toBeVisible()
    await this.ui.button('Add CNPG repository').click()

    // Add SBOMScanner repository
    if (freshInstall) {
      await expect(addSBOMRepoStep).toBeVisible()
      await this.ui.button('Add SBOMScanner repository').click()
    }

    // Install CloudNativePG
    await expect(installCNPGStep).toBeVisible()
    await this.ui.button('Install CloudNativePG').click()
    await appsPage.installChart(
      { title: 'cloudnative-pg', name: 'cnpg', check: 'cloudnative-pg' }, // namespace: 'cnpg-system'
      { navigate: false })

    // Install SBOMScanner
    await this.goto()
    await expect(installSBOMStep).toBeVisible()
    await this.ui.button('Install SBOMScanner').click()
    await appsPage.installChart(
      { title: 'SBOMScanner', check: 'rancher-sbomscanner', version: options?.version },
      { navigate : false,
        questions: async() => {
          await this.ui.input('Controller Replicas').fill('1')
          await this.ui.tab('Worker').click()
          await this.ui.input('Worker Replicas').fill('1')
          await this.ui.tab('Storage').click()
          await this.ui.input('Storage Replicas').fill('1')
          await this.ui.input('CNPG Instances').fill('1')
        } })
  }

  @step
  async addRegistry(reg: Registry) {
    await this.nav.sbomScanner('Registries configuration')
    await this.ui.button('Create').click()

    await this.ui.input('Registry*').fill(reg.name)
    await this.ui.input('URI*').fill(reg.uri)
    if (reg.namespace) await this.ui.input('Namespace*').fill(reg.namespace)
    if (reg.type) await this.ui.select('Type*').selectOption(reg.type)
    if (reg.repositories) {
      for (const repo of reg.repositories) {
        await this.ui.select('Repositories to scan').locator('input').fill(repo)
        await this.page.keyboard.press('Enter')
      }
    }
    await this.ui.button('Create').click()
  }

  @step
  async deleteRegistry(reg: string) {
    await this.nav.sbomScanner('Registries configuration')
    await this.ui.tableRow({ Registry: reg }).delete()
  }

  @step
  async triggerScan(reg: string) {
    const row = this.ui.tableRow({ Registry: reg })
    await row.action('Start scan')
    await row.toHaveState('In progress')
    await row.toHaveState('Finished')
  }

  @step
  async addVexHub(vex: VexHub) {
    await this.nav.sbomScanner('VEX Management')
    await this.ui.button('Create').click()

    await this.ui.input('Name*').fill(vex.name)
    await this.ui.input('VEX hub URI*').fill(vex.uri)
    if (vex.enabled !== undefined)
      await this.ui.checkbox('Enabled').setChecked(vex.enabled)
    await this.ui.button('Create').click()
  }

  @step
  async deleteVexHub(name: string) {
    await this.nav.sbomScanner('VEX Management')
    await this.ui.tableRow(name).delete()
  }

  @step
  async setWorkloadScan(config: WorkloadScanConfig) {
    const rules = config?.rules ?? []
    await this.nav.sbomScanner('Workloads Scan')
    if (config?.enabled !== undefined) {
      await this.ui.checkbox('Enabled').setChecked(config.enabled)
    }
    await expect(this.ui.checkbox('Enabled')).toBeChecked() // Default is enabled, so the form is visible

    for (let i = 0; i < rules.length; i++) {
      await this.ui.button('Add Rule').click()
      await this.page.locator('div.namespace-selector-row').getByTestId(`input-match-expression-key-control-${i}`).fill(rules[i].key)
      await this.page.locator('div.namespace-selector-row').getByTestId(`input-match-expression-values-control-${i}`).fill(rules[i].value)
    }
    await this.ui.button('Add Platform').click()
    await this.page.waitForTimeout(300)
    await this.ui.button('Create').click()
    await expect(this.page.getByRole('heading', { name: /^Workloads Scan.*Active$/ })).toBeVisible()
  }
}
