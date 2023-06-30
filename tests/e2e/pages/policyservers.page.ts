import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './basepage';

export class PolicyServersPage extends BasePage {
  readonly noDefaultPsBanner: Locator;

  constructor(page: Page) {
    super(page, 'dashboard/c/local/kubewarden/policies.kubewarden.io.policyserver')
    this.noDefaultPsBanner = page.locator('.banner').getByText('The default PolicyServer and policies are not installed')
  }

  async create(name: string, options?: {wait: boolean}) {
    await this.ui.createBtn.click()
    await this.ui.input('Name*').fill(name)
    await this.page.getByRole('button', { name: 'Save' }).click();

    // Check row is created and wait for Active state
    const psRow = this.ui.getRow(name)
    await psRow.row.waitFor()
    if (options?.wait) {
      await expect(psRow.status).toHaveText('Active', {timeout: 60_000})
    }
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
