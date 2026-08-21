import { expect } from '@playwright/test'
import { RancherAppsPage } from '../rancher/rancher-apps.page'
import { BasePage } from '../rancher/basepage'
import { step } from '../rancher/rancher-test'
import { RancherStoragePage, Secret } from '../rancher/rancher-storage.page'
import { conf } from '../../env-config'
import { RancherUI } from '../components/rancher-ui'

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
  enabled?   : boolean
  authSecret?: string|RegExp
  skipTLS?   : boolean // OCI specific
  nsFilter?  : Record<string, string>
  osFilter?  : Record<string, string>
}

export const authSecret: Secret = {
  type     : 'HTTP Basic Auth',
  namespace: 'cattle-system',
  name     : 'appco-auth-sbomscanner',
  username : conf.auth.appco_user || '',
  password : conf.auth.appco_pass || ''
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
    const configAuthStep = this.page.getByRole('heading', { name: /^Configure global authentication/ })
    const addReposStep = this.page.getByRole('heading', { name: 'Add required Helm repositories', exact: true })
    const installCNPGStep = this.page.getByRole('heading', { name: 'Installation for CloudNativePG', exact: true })
    const installSBOMStep = this.page.getByRole('heading', { name: 'Installation for SUSE Security Vulnerability Scanner', exact: true })

    await this.goto()
    new RancherStoragePage(this.page).createSecretInShell(authSecret)

    // Welcome screen is skipped if kubewarden is already installed
    await this.page.waitForTimeout(2000) // Ignore briefly visible welcome step
    await expect(welcomeStep.or(configAuthStep)).toBeVisible()
    if (await welcomeStep.isVisible()) {
      await this.ui.button('Start installation').click()
    }

    // AppCo Registry Auth
    await expect(configAuthStep).toBeVisible()
    await this.ui.selectOption('Authentication', new RegExp(`^${authSecret.name}`))
    await this.ui.button('Continue').click()

    // Add repositories
    await expect(addReposStep).toBeVisible()
    await this.ui.button('Add all repositories').click()

    // Install CloudNativePG
    await expect(installCNPGStep).toBeVisible()
    await this.ui.button('Install CloudNativePG').click()
    await appsPage.installChart(
      { title: 'cloudnative-pg', check: 'cloudnative-pg' },
      { navigate: false })

    // Install SBOMScanner
    await this.goto()
    await expect(installSBOMStep).toBeVisible()
    await this.ui.button('Install SUSE Security Vulnerability Scanner').click()
    await appsPage.installChart(
      { title: 'SBOMScanner', check: 'suse-security-vulnerability-scanner', version: options?.version },
      { navigate : false,
        yamlPatch: (y) => {
          // Value is not set automatically in Rancher < 2.14
          if (RancherUI.isVersion('<2.14')) y.global.imagePullSecrets[0] = authSecret.name
          y.controller.replicas = 1
          y.worker.replicas = 1
          y.storage.replicas = 1
          y.storage.postgres.cnpg.instances = 1
        }
        // questions: async() => {
        //   await this.ui.input('Controller Replicas').fill('1')
        //   await this.ui.tab('Worker').click()
        //   await this.ui.input('Worker Replicas').fill('1')
        //   await this.ui.tab('Storage').click()
        //   await this.ui.input('Storage Replicas').fill('1')
        //   await this.ui.input('CNPG Instances').fill('1')
        // }
      })
  }

  @step
  async addRegistry(reg: Registry) {
    await this.nav.sbomScanner('Registries Configuration')
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
    await this.nav.sbomScanner('Registries Configuration')
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
    await this.nav.sbomScanner('Workloads Scan')

    if (config.enabled !== undefined) {
      await this.ui.checkbox('Enabled').setChecked(config.enabled)
    }
    if (config.authSecret) {
      await this.ui.selectOption('Authentication', config.authSecret)
    }
    if (config.skipTLS !== undefined) {
      await this.ui.checkbox('Allow insecure connections').setChecked(config.skipTLS)
    }

    if (config.nsFilter) {
      const line = this.page.locator('div.match-expression-row').last()
      for (const [key, value] of Object.entries(config.nsFilter)) {
        await this.ui.button('Add Rule').click()
        await line.getByTestId(/^input-match-expression-key-control-/).fill(key)
        await line.getByTestId(/^input-match-expression-values-control-/).fill(value)
      }
    }

    if (config.osFilter) {
      const line = this.page.locator('div.row-platforms').last()
      for (const [os, arch] of Object.entries(config.osFilter)) {
        await this.ui.button('Add Platform').click()
        await this.ui.selectOption(line.locator('div.labeled-select').nth(0), os)
        await this.ui.selectOption(line.locator('div.labeled-select').nth(1), arch)
      }
    }

    await this.page.waitForTimeout(300)
    await this.ui.button(/Create|Save/).click()

    if (config.enabled !== undefined) {
      await expect(this.page.locator('span.badge-state')).toHaveText(config.enabled ? 'Active' : 'Disabled')
    }
  }
}
