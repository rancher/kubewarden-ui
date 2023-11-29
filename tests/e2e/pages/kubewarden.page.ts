import { expect, test, Locator, Page } from '@playwright/test'
import { BasePage } from './basepage'
import { RancherAppsPage } from './rancher-apps.page'

type Pane = 'Policy Servers' | 'Admission Policies' | 'Cluster Admission Policies'

export class KubewardenPage extends BasePage {
    readonly createPsBtn: Locator;
    readonly createApBtn: Locator;
    readonly createCapBtn: Locator;

    constructor(page: Page) {
      super(page)
      this.createPsBtn = this.ui.button('Create Policy Server')
      this.createApBtn = this.ui.button('Create Admission Policy')
      this.createCapBtn = this.ui.button('Create Cluster Admission Policy')
    }

    async goto(): Promise<void> {
      // await this.nav.explorer('Kubewarden')
      await this.page.goto('dashboard/c/local/kubewarden')
    }

    getPane(name: Pane) {
      return this.page.locator('div.card-container').filter({
        has: this.page.getByRole('heading', { name, exact: true })
      })
    }

    getStats(pane: Pane) {
      return this.getPane(pane).locator('span.numbers-stats')
    }

    async installKubewarden() {
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
      await this.goto()
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

      // Cert-Manager

      // Redirection to rancher app installer
      await expect(appInstallStep).toBeVisible()
      await installBtn.click()
      await expect(this.page).toHaveURL(/.*\/apps\/charts\/install.*chart=kubewarden-controller/)

      // ==================================================================================================
      // Rancher Application Metadata
      const apps = new RancherAppsPage(this.page)
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
      await apps.waitHelmSuccess('rancher-kubewarden-controller')
    }

    async whitelistArtifacthub() {
      await expect(this.page.getByText('Official Kubewarden policies are hosted on ArtifactHub')).toBeVisible()
      await this.page.getByRole('button', { name: 'Add ArtifactHub To Whitelist' }).click()
    }
}
