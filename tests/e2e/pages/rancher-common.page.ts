import { expect, Page } from '@playwright/test';
import { BasePage } from './basepage';

export interface Chart {
  title: string,
  name: string,
  namespace?: string,
  project?: string,
}

export class RancherCommonPage extends BasePage {

  constructor(page: Page) {
    super(page)
  }

  async isLoggedIn() {
    const password = this.ui.input('Password')
    const userMenu = this.page.locator('div.user-menu')
    await Promise.race([password.waitFor(), userMenu.waitFor()])
    return await userMenu.isVisible()
  }

  async handleFirstLogin(password: string) {
    // Password
    await this.ui.input('Password').fill(password)
    await this.page.getByRole('button', {name: 'Log in with Local User'}).click()
    // End user agreement
    await this.ui.checkbox('Allow collection of anonymous statistics').uncheck()
    await this.ui.checkbox('End User License Agreement').check()
    await this.ui.button('Continue').click()
    // User menu should be visible
    await expect(this.page.locator('div.user-menu')).toBeVisible()
  }

  /**
   * Common ids: #all | #all_user | #all_system | #ns_cattle-kubewarden-system
   * Common names: All Namespaces | Only User Namespaces | cattle-kubewarden-system
   *
   * @param filter Use #id or exact name of the filter
   */
  async setNamespaceFilter(filter: string) {
    await this.page.goto('dashboard/c/local/explorer')
    await expect(this.page.getByRole('heading', { name: 'Cluster Dashboard' })).toBeVisible()

    const nsMenu     = this.page.getByTestId('namespaces-menu')
    const nsDropdown = this.page.getByTestId('namespaces-dropdown')

    // Open menu (n)
    await nsDropdown.locator('i.icon-chevron-down').click()

    // Clean current and set requested filters
    await nsMenu.locator('.ns-controls > .ns-clear').click()
    const nsOption = filter.startsWith('#')
      ? nsMenu.locator(filter)
      : nsMenu.locator('div.ns-option').filter({has: this.page.getByText(filter, {exact:true})})
    await nsOption.click()
    await expect(nsOption.locator('i.icon-checkmark')).toBeVisible()

    // Close menu (Escape)
    await nsDropdown.locator('i.icon-chevron-up').click()
  }

  async setHelmCharts(option: 'Show Releases Only'|'Include Prerelease Versions') {
    await this.page.goto('/dashboard/prefs')
    const btn = this.page.getByRole('button', {name: option, exact: true})
    await btn.click()
    await expect(btn).toHaveClass(/bg-primary/)
    await this.page.waitForTimeout(100)
  }

  /**
   * Change user preferences
   * @param checked Switch developer features on | off
   */
  async setExtensionDeveloperFeatures(enabled: boolean) {
    await this.page.goto('/dashboard/prefs')
    await expect(this.page.getByRole('heading', { name: 'Advanced Features' })).toBeVisible()
    await this.ui.checkbox('Enable Extension developer features').setChecked(enabled)
  }

  /**
   * Add helm charts repository to local cluster
   * @param name
   * @param url Git or http(s) url of the repository
   */
  async addRepository(name:string, url:string) {
    await this.page.goto('dashboard/c/local/apps/catalog.cattle.io.clusterrepo/create')

    await this.ui.input('Name *').fill(name)
    if (url.endsWith('.git')) {
      await this.page.getByRole('radio', { name: 'Git repository' }).check()
      await this.ui.input('Git Repo URL *').fill(url)
    } else {
      await this.page.getByRole('radio', { name: 'http(s) URL' }).check()
      await this.ui.input('Index URL *').fill(url)
    }
    await this.page.getByRole('button', { name: 'Create' }).click();

    // Check repository state is Active
    await this.ui.getRow(name).toBeActive()
  }

  async installApp(chart: Chart) {
    // Select chart
    await this.page.goto('dashboard/c/local/apps/charts')
    await expect(this.page.getByRole('heading', { name: 'Charts', exact: true })).toBeVisible()
    await this.page.locator('.grid > .item').getByRole('heading', { name: chart.title, exact: true }).click()
    await this.page.getByRole('button', { name: 'Install' }).click()

    // Select namespace or project
    if (chart.namespace) {
        await expect(this.page.getByRole('heading', { name: 'Install: Step 1' })).toBeVisible()
        await this.ui.select('Namespace *', 'Create a New Namespace')
        await this.ui.input('Namespace').fill(chart.namespace)
    }
    if (chart.project) {
        await this.ui.select('Install into Project', chart.project)
    }

    // Installation & Wait
    await this.page.getByRole('button', { name: 'Next' }).click() // readme
    await this.page.getByRole('button', { name: 'Install' }).click()
    await expect(this.ui.helmPassRegex(chart.name)).toBeVisible({timeout:300_000})
  }

  // Without parameters only for upgrade/reload
  async updateApp(chart: Chart) {
    await this.page.goto('dashboard/c/local/apps/catalog.cattle.io.app')
    await expect(this.page.getByRole('heading', { name: 'Installed Apps' })).toBeVisible()

    await this.ui.getRow(chart.name).action('Edit/Upgrade')
    await expect(this.page.getByRole('heading', { name: chart.name })).toBeVisible()

    await this.page.getByRole('button', { name: 'Next' }).click() // version
    await this.page.getByRole('button', { name: 'Update' }).click()
    await expect(this.ui.helmPassRegex(chart.name)).toBeVisible({timeout:300_000})
  }

}
