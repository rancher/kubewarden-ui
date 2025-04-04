import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { TableRow } from '../components/table-row'
import { step } from '../rancher/rancher-test'
import { BasePage } from '../rancher/basepage'
import { RancherAppsPage } from '../rancher/rancher-apps.page'

export interface PolicyServer {
  name     : string
  replicas?: number
  image?   : string
  settings?(): Promise<void>
}

export class PolicyServersPage extends BasePage {
  readonly noDefaultPsBanner: Locator

  constructor(page: Page) {
    super(page)
    this.noDefaultPsBanner = page.locator('.banner').getByText('The default PolicyServer and policies are not installed')
  }

  async goto(): Promise<void> {
    await this.nav.pservers()
  }

  async setName(name: string) {
    await this.ui.input('Name*').fill(name)
  }

  async setReplicas(replicas: number) {
    await this.ui.input('Replicas*').fill(replicas.toString())
  }

  async setImage(image: string) {
    await this.ui.radio('Default Image', 'No').check()
    await this.ui.input('Image URL').fill(image)
  }

  @step
  async setValues(ps: PolicyServer) {
    await this.setName(ps.name)
    if (ps.replicas !== undefined) await this.setReplicas(ps.replicas)
    if (ps.image !== undefined) await this.setImage(ps.image)
    if (ps.settings) {
      await ps.settings()
      await this.ui.openView('Edit YAML')
    }
  }

  @step
  async create(ps: PolicyServer, options?: { wait?: boolean, navigate?: boolean }): Promise<TableRow> {
    if (options?.navigate !== false) {
      await this.goto()
      await this.ui.button('Create').click()
    }
    // Page is ready when it loads default image
    await expect(this.page.getByTestId('ps-config-image-inputs').getByText('Default Image')).toBeVisible()

    await this.setValues(ps)
    await this.ui.button('Create').click()
    // Get row and wait for Active state
    const psRow = await this.ui.tableRow(ps.name).waitFor()
    if (options?.wait) {
      await psRow.toBeActive(20_000)
    }
    return psRow
  }

  async delete(ps: string | TableRow) {
    await this.goto()
    if (typeof ps === 'string') ps = this.ui.tableRow(ps)
    await ps.delete()
  }

  async installDefault(options?: { version?: string, recommended?: boolean, mode?: 'monitor' | 'protect' }) {
    const apps = new RancherAppsPage(this.page)
    // Use custom version if requested
    if (options?.version) await apps.swapUrlVersion(options.version)
    await expect(apps.step1).toBeVisible()
    await apps.nextBtn.click()
    await expect(apps.step2).toBeVisible()

    // Handle questions
    if (options?.recommended) {
      await this.ui.checkbox('Enable recommended policies').setChecked(options.recommended)
      await expect(this.ui.select('Execution mode of the recommended policies ')).toContainText('monitor')
    }
    if (options?.mode) {
      await this.ui.selectOption('Execution mode', options.mode)
    }

    // Install
    await apps.installBtn.click()
    await apps.waitHelmSuccess('rancher-kubewarden-defaults')
  }
}
