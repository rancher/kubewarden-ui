import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import type { YAMLPatch } from '../components/rancher-ui'
import { step } from '../rancher-test'
import { BasePage } from './basepage'

export interface Chart {
    title: string, // Exact chart title displayed in Rancher
    check: string, // Used to check for helm success, chart name or tgz
    name?: string, // Desired chart name
    version?: string,
    namespace?: string,
    project?: string,
}

export class RancherAppsPage extends BasePage {
    readonly step1: Locator
    readonly step2: Locator
    readonly nextBtn: Locator
    readonly installBtn: Locator
    readonly updateBtn: Locator

    constructor(page: Page) {
      super(page)
      this.step1 = page.getByRole('heading', { name: 'Install: Step 1' })
      this.step2 = page.getByRole('heading', { name: 'Install: Step 2' })
      this.nextBtn = this.ui.button('Next')
      this.installBtn = this.ui.button('Install')
      this.updateBtn = this.ui.button('Update')
    }

    async goto(): Promise<void> {
      // await this.nav.explorer('Apps', 'Charts')
      await this.page.goto('dashboard/c/local/apps/charts')
    }

    /**
     * Add helm charts repository to local cluster
     * @param name
     * @param url Git or http(s) url of the repository
     */
    @step
    async addRepository(name: string, url: string) {
      await this.nav.explorer('Apps', 'Repositories')
      await this.ui.button('Create').click()

      await this.ui.input('Name *').fill(name)
      if (url.endsWith('.git')) {
        await this.page.getByRole('radio', { name: 'Git repository' }).check()
        await this.ui.input('Git Repo URL *').fill(url)
      } else {
        await this.page.getByRole('radio', { name: 'http(s) URL' }).check()
        await this.ui.input('Index URL *').fill(url)
      }
      await this.ui.button('Create').click()

      // Transitions: Active ?> In Progress ?> [Active|InProgress]
      const repo = await this.ui.tableRow(name).waitFor()
      // Wait out first Active state
      await this.page.waitForTimeout(1000)
      // Refresh for occasional freeze In Progress
      await repo.action('Refresh')
      await repo.toBeActive()
    }

    @step
    async deleteRepository(name: string) {
      await this.nav.explorer('Apps', 'Repositories')
      await this.ui.tableRow(name).delete()
    }

    /**
     * Build regex matching chart name or archive for a successfull installation
     * SUCCESS: helm upgrade ... rancher-kubewarden-defaults /home/shell/helm/kubewarden-defaults-1.7.3.tgz
     * SUCCESS: helm [install|upgrade] [--generate-name=true|name]  /home/shell/helm/opentelemetry-operator-0.38.0.tgz
     */
    async waitHelmSuccess(text: string, options?: { timeout?: number, keepLog?: boolean }) {
      const timeout = options?.timeout || 60_000
      const keepLog = options?.keepLog || false

      // Can't match ^..$ because output is sometimes mixed up
      const rmMatch = `uninstall.*\\s${text}\\s` // delete app
      const nameMatch = `\\s${text}\\s\\/home` // app upgrades
      const tarMatch = `helm\\/${text}-[0-9-.]+tgz` // chart installations
      const regex = new RegExp(`SUCCESS: helm.*(${nameMatch}|${tarMatch}|${rmMatch})`)

      const passedMsg = this.page.locator('div.logs-container').locator('span.msg').getByText(regex)
      await expect(passedMsg).toBeVisible({ timeout })
      // Close the window
      if (keepLog === false) {
        const win = this.page.locator('#windowmanager')
        await win.locator('div.tab.active').locator('i.closer').click()
      }
    }

    @step
    async installChart(chart: Chart, options?: { questions?: () => Promise<void>, yamlPatch?: YAMLPatch, timeout?: number, navigate?: boolean }) {
      // Select chart by title
      if (options?.navigate !== false) {
        await this.nav.explorer('Apps', 'Charts')
        await expect(this.page.getByRole('heading', { name: 'Charts', exact: true })).toBeVisible()
        await this.page.locator('.grid > .item').getByRole('heading', { name: chart.title, exact: true }).click()

        if (chart.version) {
          const versionPane = this.page.getByRole('heading', { name: 'Chart Versions', exact: true }).locator('..')
          await versionPane.getByText('Show More', { exact: true }).click()
          // Active version is bold text, not active are links
          await versionPane.getByText(chart.version, { exact: true }).click()
          await expect(versionPane.locator(`b:text-is("${chart.version}")`)).toBeVisible()
        }
        await this.installBtn.click()
      }

      // Chart metadata
      await expect(this.step1).toBeVisible()
      if (chart.name) {
        await this.ui.input('Name').fill(chart.name)
      }
      if (chart.namespace) {
        await this.ui.select('Namespace *', /^Create a [nN]ew Namespace$/)
        await this.ui.input('Namespace').fill(chart.namespace)
      }
      if (chart.project) {
        await this.ui.select('Install into Project', chart.project)
      }
      await this.nextBtn.click()

      // Chart questions
      if (options?.questions) await options.questions()
      if (options?.yamlPatch) {
        await this.ui.openView('Edit YAML')
        await this.ui.editYaml(options.yamlPatch)
        await this.ui.openView('Compare Changes')
      }

      // Installation & Wait
      await this.installBtn.click()
      await this.waitHelmSuccess(chart.check, { timeout: options?.timeout })
    }

    // Without parameters only for upgrade/reload
    @step
    async updateApp(name: string, options?: { questions?: () => Promise<void>, yamlPatch?: YAMLPatch, timeout?: number, navigate?: boolean }) {
      if (options?.navigate !== false) {
        await this.nav.explorer('Apps', 'Installed Apps')
        await expect(this.page.getByRole('heading', { name: 'Installed Apps' })).toBeVisible()

        await this.ui.tableRow(name).action('Edit/Upgrade')
        await expect(this.page.getByRole('heading', { name })).toBeVisible()
      }
      // Skip Step1
      await this.nextBtn.click()

      // Chart questions
      if (options?.questions) await options.questions()
      if (options?.yamlPatch) {
        await this.ui.openView('Edit YAML')
        await this.ui.editYaml(options.yamlPatch)
        await this.ui.openView('Compare Changes')
      }

      await this.updateBtn.click()
      await this.waitHelmSuccess(name, { timeout: options?.timeout })
    }

    @step
    async deleteApp(name: string) {
      await this.nav.explorer('Apps', 'Installed Apps')
      await expect(this.page.getByRole('heading', { name: 'Installed Apps' })).toBeVisible()
      // Row is visible until helm uninstalls app
      await this.ui.tableRow(name).delete({ timeout: 60_0000 })
      await this.waitHelmSuccess(name)
    }
}
