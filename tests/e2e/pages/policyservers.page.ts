import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './basepage';

export class PolicyServersPage extends BasePage {
  readonly noDefaultPsBanner: Locator;

  constructor(page: Page) {
    super(page, 'dashboard/c/local/kubewarden/policies.kubewarden.io.policyserver')
    this.noDefaultPsBanner = page.locator('.banner').getByText('The default PolicyServer and policies are not installed')
  }

  public getState(row: Locator) {
    return row.locator('td.col-policy-server-status')
  }

  public getPolicies(row: Locator) {
    return row.locator('td.col-policy-summary-graph')
  }

  async create(name: string) {
    await this.page.getByRole('button', { name: 'Create' }).click();
    await this.page.getByPlaceholder('A unique name').fill(name);
    await this.page.getByRole('button', { name: 'Save' }).click();

    // Wait for Active state
    const row = this.ui.getRow(name)
    await expect(this.getState(row)).toHaveText('Active')
  }

  async delete(name: string) {
    const row = this.ui.getRow(name)
    this.ui.deleteRow(row)
  }

  async installDefaultDialog(recommended: {enable: boolean, mode?: 'monitor' | 'protect'}) {
    await this.ui.checkbox('Enable recommended policies').check()

    if (recommended.enable && recommended.mode) {
      await this.ui.select('Execution mode', recommended.mode)
    }
  };

}
