import { expect } from '@playwright/test'
import { step } from '../rancher/rancher-test'
import { BasePage } from './basepage'
import { RancherUI } from '../components/rancher-ui'

export class RancherCommonPage extends BasePage {
  goto(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  /**
   * Wait for PUT call response to prevent race condition:
   * Initial state:     data: [developer: false, pre-release: false]
   * Enable developer:   req: [developer: true,  pre-release: false]
   * Enable pre-release: req: [developer: false, pre-release: true]
   * Final state:       data: [developer: false, pre-release: true]
   * https://github.com/rancher/dashboard/issues/16874
   */
  private async waitPut(action: () => Promise<void>) {
    const response = this.page.waitForResponse(
      res => res.url().includes('/v1/userpreferences/') && res.request().method() === 'PUT'
    )
    await action()
    await response
  }

  async isLoggedIn() {
    const password = this.ui.input('Password')
    const userMenu = this.page.getByTestId('nav_header_showUserMenu')
    await userMenu.or(password).waitFor()
    return await userMenu.isVisible()
  }

  async handleFirstLogin(password: string) {
    // Password
    await this.ui.input('Password').fill(password)
    await this.ui.button('Log in with Local User').click()
    // End user agreement
    if (RancherUI.isVersion('<2.11')) await this.ui.checkbox('Allow collection of anonymous statistics').uncheck()
    await this.ui.checkbox('End User License Agreement').check()
    await this.ui.button('Continue').click()
    // User menu should be visible
    await expect(this.page.getByTestId('nav_header_showUserMenu')).toBeVisible()
  }

  /**
     * Common ids: #all | #all_user | #all_system | #ns_cattle-kubewarden-system
     * Common names: All Namespaces | Only User Namespaces | cattle-kubewarden-system
     *
     * @param filter Use #id or exact name of the filter
     */
  @step
  async setNamespaceFilter(filter: string) {
    await expect(this.page.getByTestId('namespaces-filter')).toBeVisible()

    const nsMenu = this.page.getByTestId('namespaces-menu')
    const nsDropdown = this.page.getByTestId('namespaces-dropdown')

    // Open menu (n)
    await nsDropdown.locator('i.icon-chevron-down').click()

    // Clean current and set requested filters
    await nsMenu.locator('.ns-controls > .ns-clear').click()
    const nsOption = filter.startsWith('#')
      ? nsMenu.locator(filter)
      : nsMenu.locator('div.ns-option').filter({ has: this.page.getByText(filter, { exact: true }) })
    await this.waitPut(() => nsOption.click())
    await expect(nsOption.locator('i.icon-checkmark')).toBeVisible()

    // Close menu (Escape)
    await nsDropdown.locator('i.icon-chevron-up').click()
  }

  async setHelmCharts(option: 'Show Releases Only' | 'Include Prerelease Versions') {
    await this.waitPut(() => this.ui.button(option).click())
  }

  /**
   * Change user preferences
   * @param checked Switch developer features on | off
   */
  async setExtensionDeveloperFeatures(enabled: boolean) {
    const devCheckbox = this.ui.checkbox('Enable Extension developer features')
    if (enabled !== await devCheckbox.isChecked()) {
      await this.waitPut(() => devCheckbox.setChecked(enabled))
    }
  }
}
