import { Locator, Page } from '@playwright/test';
import { BasePage } from './basepage';

export class PolicyServersPage extends BasePage {
  readonly noDefaultPsBanner: Locator;
  readonly saveBtn: Locator

  constructor(page: Page) {
    super(page, 'dashboard/c/local/kubewarden/policies.kubewarden.io.policyserver')
    this.noDefaultPsBanner = page.locator('.banner').getByText('The default PolicyServer and policies are not installed')
    this.saveBtn = page.getByRole('button', { name: 'Save', exact: true })
  }

  async setName(name: string) {
    await this.ui.input('Name*').fill(name)
  }

  async create(name: string, options?: {wait: boolean}) {
    await this.ui.createBtn.click()
    await this.setName(name)
    await this.saveBtn.click()

    // Check row is created and wait for Active state
    const psRow = this.ui.getRow(name)
    await psRow.toBeVisible()
    if (options?.wait) {
      await psRow.toBeActive(60_000)
    }
    return psRow
  }

  async delete(name: string) {
    await this.ui.getRow(name).delete()
  }

  async installDefaultDialog(recommended: {enable: boolean, mode?: 'monitor' | 'protect'}) {
    await this.ui.checkbox('Enable recommended policies').check()

    if (recommended.enable && recommended.mode) {
      await this.ui.select('Execution mode', recommended.mode)
    }
  };

}
