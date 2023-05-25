import { expect, Page, Locator } from '@playwright/test';

export class TableRow {

  private readonly page: Page
  readonly body: Locator

  constructor(page: Page, name: string) {
    this.page = page
    this.body = page.locator('tr.main-row').filter({has: page.getByRole('link', {name: name, exact: true})})
  }

  column(name: string) {
    // https://stackoverflow.com/questions/14745478/how-to-select-table-column-by-column-header-name-with-xpath
    return this.body.locator(`xpath=/td[count(//table/thead/tr/th[normalize-space(.)="${name}"]/preceding-sibling::th)+1]`)
  }

  async action(name: string) {
    // Alternative: locator(`button[id$='+${name}']`) - id="actionButton+0+rancher-kubewarden-controller"
    await this.body.locator('button.actions').click()
    await this.page.getByRole('listitem').getByText(name, {exact: true}).click()
  }

  async delete() {
    await this.action('Delete')
    await this.page.getByTestId('prompt-remove-confirm-button').click()
    await expect(this.body).not.toBeVisible();
  }

}
