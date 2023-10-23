import { Page, expect } from '@playwright/test';
import type { Locator, FrameLocator } from '@playwright/test';
import { BasePage } from './basepage';

export class PolicyReporterPage extends BasePage {
  readonly frame: FrameLocator;
  readonly failNsBanner: Locator;
  readonly failNsTable: Locator;
  readonly failCpBanner: Locator;
  readonly failCpTable: Locator;

  constructor(page: Page) {
    super(page, 'dashboard/c/local/kubewarden/policy-reporter')
    this.frame = page.frameLocator('[data-testid="kw-pr-iframe"]')
    this.failCpBanner = this.frame.getByText('Failing Cluster Policies', {exact:true}).locator('xpath=./following-sibling::div')
    this.failNsBanner = this.frame.getByText('Failing Policy Results per Namespace', {exact:true}).locator('xpath=./following-sibling::div')
    this.failCpTable = this.frame.getByText('Failing ClusterPolicy Results', {exact: true}).locator('xpath=./following-sibling::div//table')
    this.failNsTable = this.frame.getByText('Failing Policy Results', {exact: true}).locator('xpath=./following-sibling::div//table')
  }

  async selectTab(name: 'Dashboard'|'Policy Reports'|'ClusterPolicy Reports'|'Logs') {
    const menu = this.frame.locator('header').locator('i.mdi-menu')
    const overlay = this.frame.locator('div.v-overlay--active')
    const tabItem = this.frame.locator('nav').getByRole('link', {name: name, exact: true})

    // Wait until iframe is loaded
    await expect(this.frame.locator('header')).toBeVisible()

    // If screen is too small then menu is open with overlay
    if (await overlay.isVisible() && name == 'Dashboard') {
      await overlay.click()
    } else {
      // Open menu if not visible & select tab
      if (!await tabItem.isVisible()) await menu.click()
      await tabItem.click()
    }
    // Menu animation can match previous closing nemu
    await this.page.waitForTimeout(500)
  }

}
