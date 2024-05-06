import { expect } from '@playwright/test'
import { BasePage } from './basepage'

export class RancherCommonPage extends BasePage {
  goto(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async isLoggedIn() {
    const password = this.ui.input('Password')
    const userMenu = this.page.locator('div.user-menu')
    await userMenu.or(password).waitFor()
    return await userMenu.isVisible()
  }

  async handleFirstLogin(password: string) {
    // Password
    await this.ui.input('Password').fill(password)
    await this.ui.button('Log in with Local User').click()
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
    await expect(this.page.getByRole('heading', { name: 'Cluster Dashboard' })).toBeVisible()

    const nsMenu = this.page.getByTestId('namespaces-menu')
    const nsDropdown = this.page.getByTestId('namespaces-dropdown')

    // Open menu (n)
    await nsDropdown.locator('i.icon-chevron-down').click()

    // Clean current and set requested filters
    await nsMenu.locator('.ns-controls > .ns-clear').click()
    const nsOption = filter.startsWith('#')
      ? nsMenu.locator(filter)
      : nsMenu.locator('div.ns-option').filter({ has: this.page.getByText(filter, { exact: true }) })
    await nsOption.click()
    await expect(nsOption.locator('i.icon-checkmark')).toBeVisible()

    // Close menu (Escape)
    await nsDropdown.locator('i.icon-chevron-up').click()
  }

  async setHelmCharts(option: 'Show Releases Only' | 'Include Prerelease Versions') {
    const btn = this.ui.button(option)
    await btn.click()
    await expect(btn).toHaveClass(/bg-primary/)
    await this.page.waitForTimeout(100)
  }

  /**
     * Change user preferences
     * @param checked Switch developer features on | off
     */
  async setExtensionDeveloperFeatures(enabled: boolean) {
    await expect(this.page.getByRole('heading', { name: 'Advanced Features' })).toBeVisible()
    await this.ui.checkbox('Enable Extension developer features').setChecked(enabled)
  }
}
