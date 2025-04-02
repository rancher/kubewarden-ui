import { expect, test, Locator, Page } from '@playwright/test'
import { RancherAppsPage } from '../rancher/rancher-apps.page'
import { BasePage } from '../rancher/basepage'
import { Shell } from '../components/kubectl-shell'
import { step } from '../rancher/rancher-test'

type Pane = 'Policy Servers' | 'Namespaced Policies' | 'Cluster Policies'

export interface AppVersion {
  app: string
  controller?: string
  crds?: string
  defaults?: string
}

export class KubewardenPage extends BasePage {
    readonly currentApp: Locator;
    readonly upgradeApp: Locator;
    readonly upController: Locator;
    readonly upDefaults: Locator;

    constructor(page: Page) {
      super(page)
      const head = this.page.locator('div.head')
      this.currentApp = head.locator('div.head-version')
      this.upgradeApp = head.locator('div.head-upgrade')
      this.upController = head.getByTestId('kw-app-controller-upgrade-button')
      this.upDefaults = head.getByTestId('kw-app-defaults-upgrade-button')
    }

    async goto(): Promise<void> {
      await this.nav.kubewarden()
    }

    getPane(name: Pane) {
      return this.page.locator('div.card-container').filter({
        has: this.page.getByRole('heading', { name, exact: true })
      })
    }

    getCount(pane: Pane) {
      return this.getPane(pane).locator('span.count')
    }

    getPolicyServer(name: string|RegExp) {
      return this.getPane('Policy Servers').getByRole('listitem').filter({has: this.page.getByRole('link', {name: name, exact: true})})
    }

    @step
    async getCurrentVersion(): Promise<AppVersion> {
      await this.nav.kubewarden()
      const verText = await this.currentApp.innerText()
      const parts = verText.split(/\s+/)
      return { app: parts[2] }
    }

    @step
    async getUpgrade(): Promise<AppVersion|null> {
      await this.nav.kubewarden()
      if (await this.upgradeApp.isVisible()) {
        // Parse versions from "App Upgrade: v1.9.0 - Controller|Defaults: 2.0.5"
        const upText = await this.upgradeApp.innerText()
        const parts = upText.split(/\s+/)
        return { app: parts[2], controller: parts[5] }
      } else return null
    }

    @step
    async installKubewarden(options?: { version?: string }) {
      // ==================================================================================================
      // Requirements Dialog
      const welcomeStep = this.page.getByText('Kubewarden is a policy engine for Kubernetes.')
      const addRepoStep = this.page.getByRole('heading', { name: 'Repository', exact: true })
      const appInstallStep = this.page.getByRole('heading', { name: 'Kubewarden App Install', exact: true })
      const installBtn = this.ui.button('Install Kubewarden')
      const addRepoBtn = this.ui.button('Add Kubewarden Repository')
      const failRepo = this.page.getByText('Unable to fetch Kubewarden Helm chart')
      const failRepoBtn = this.ui.button('Reload')

      // Welcome screen
      await this.ui.retry(async() => {
        await this.goto()
      }, 'Kubewarden extension not visible')

      await expect(welcomeStep).toBeVisible()
      await installBtn.click()

      // Add repository screen
      await expect(addRepoStep).toBeVisible()
      await addRepoBtn.click()
      // Wait repo state changes between Active / In Progress
      await this.page.waitForTimeout(5_000)

      // Wait for install button or handle repo failure
      try {
        await expect(installBtn).toBeVisible()
      } catch (e) {
        test.info().annotations.push({ type: 'BUG', description: 'Failed to add kw repository' })
        // 2 possible fails
        await expect(failRepo.or(addRepoBtn)).toBeVisible()
        if (await failRepo.isVisible()) {
          await failRepoBtn.click()
        } else {
          await this.page.reload()
        }
        await expect(welcomeStep).toBeVisible()
        await installBtn.click()
      }

      // Redirection to rancher app installer
      await expect(appInstallStep).toBeVisible()
      await installBtn.click()
      await expect(this.page).toHaveURL(/.*\/apps\/charts\/install.*chart=kubewarden-controller/)

      // ==================================================================================================
      // Rancher Application Metadata
      const apps = new RancherAppsPage(this.page)
      // Use custom version if requested
      if (options?.version) await apps.swapUrlVersion(options.version)
      await expect(apps.step1).toBeVisible()
      await apps.nextBtn.click()
      await expect(apps.step2).toBeVisible()

      // Rancher Application Values
      await expect(this.ui.checkbox('Enable Background Audit check ')).toBeChecked()
      const schedule = this.ui.input('Schedule')
      await expect(schedule).toHaveValue('*/60 * * * *')
      await schedule.fill('*/1 * * * *')
      await this.ui.checkbox('Enable Policy Reporter').check()

      // Start installation
      await apps.installBtn.click()
      await apps.waitHelmSuccess('rancher-kubewarden-crds', { keepLog: true })
      await apps.waitHelmSuccess('rancher-kubewarden-controller', { timeout: 4 * 60_000 })
    }

    @step
    async upgrade(options?: { from?: AppVersion, to?: AppVersion }) {
      const from = options?.from
      const to = options?.to
      const apps = new RancherAppsPage(this.page)

      const shell = new Shell(this.page)

      // Check versions before upgrade
      if (from) await expect(this.currentApp).toContainText(`App Version: ${from.app}`)
      if (to) await expect(this.upgradeApp).toContainText(`App Upgrade: ${to.app}`)

      // Controller upgrade
      if (to?.controller) await expect(this.upController).toContainText(`Controller: ${to.controller}`)
      await this.upController.click()
      if (from?.controller || to?.controller) {
        await expect(apps.stepTitle).toContainText(`${from?.controller || ''} > ${to?.controller || ''}`)
      }
      await apps.updateApp('rancher-kubewarden-controller', { navigate: false, timeout: 4 * 60_000 })
      // 4.1.0 Error: error while loading policies from "/config/policies.yml": data did not match any variant of untagged enum PolicyOrPolicyGroup
      // 5.0.0 Probe port change from https to http
      if (!to?.controller?.startsWith('4.1') && !to?.controller?.startsWith('5.0')) {
        await shell.waitPods()
      }

      // Defaults upgrade
      await this.nav.kubewarden()
      if (to?.defaults) await expect(this.upDefaults).toContainText(`Defaults: ${to.defaults}`)
      await this.upDefaults.click()
      if (from?.defaults || to?.defaults) {
        await expect(apps.stepTitle).toContainText(`${from?.defaults || ''} > ${to?.defaults || ''}`)
      }
      await apps.updateApp('rancher-kubewarden-defaults', { navigate: false })

      // Check resources are online
      await this.nav.explorer('Apps', 'Installed Apps')
      for (const chart of ['controller', 'crds', 'defaults']) {
        await apps.checkChart(`rancher-kubewarden-${chart}`, to ? to[chart] : undefined)
      }
      await shell.waitPods()
    }
}
