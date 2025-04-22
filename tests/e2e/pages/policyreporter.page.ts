import { Page, expect } from '@playwright/test'
import type { FrameLocator } from '@playwright/test'
import { BasePage } from '../rancher/basepage'
import { step } from '../rancher/rancher-test'

export class PolicyReporterPage extends BasePage {
  readonly frame: FrameLocator

  constructor(page: Page) {
    super(page)
    this.frame = page.frameLocator('[data-testid="kw-pr-iframe"]')
  }

  getCard(name: 'pass' | 'warn' | 'fail' | 'error') {
    return this.frame.locator('div.v-card-item').filter({ has: this.page.getByText(name, { exact: true }) }).locator('xpath=./following-sibling::div')
  }

  getChip(name: string|RegExp, chip: 'pass' | 'warn' | 'fail' | 'error') {
    return this.frame.locator('a.v-list-item').filter({ has: this.page.getByText(name, { exact: true }) }).locator(`.v-chip.bg-status-${chip}`)
  }

  async goto(): Promise<void> {
    await this.nav.kubewarden('Policy Reporter')
  }

  @step
  async selectTab(name: 'Dashboard' | 'Other' | 'Policy Dashboard' | 'Kubewarden') {
    const menuButton = this.frame.locator('header').locator('i.mdi-menu')
    const menuActive = this.frame.locator('nav.v-navigation-drawer.v-navigation-drawer--active')
    const overlay = this.frame.locator('div.v-navigation-drawer__scrim')
    const tabItem = this.frame.locator('nav').getByRole('link', { name, exact: true })

    // Wait until iframe is loaded
    await expect(menuButton).toBeVisible()

    // Open menu & select tab
    if (!await menuActive.isVisible()) await menuButton.click()
    await tabItem.click()
    await expect(tabItem).toContainClass('v-list-item--active')

    // Menu animation can match previous closing nemu
    await this.page.waitForTimeout(500)
    // Close overlay if it's open
    if (await overlay.isVisible()) {
      await overlay.click()
      await expect(overlay).not.toBeVisible()
    }
  }

  async runJob() {
    await this.nav.explorer('Workloads', 'CronJobs')
    await this.ui.tableRow('audit-scanner').action('Run Now')
    await this.ui.tableRow(/audit-scanner-[0-9]+/).waitFor({ state: 'Completed', timeout: 30_000 })
  }
}
