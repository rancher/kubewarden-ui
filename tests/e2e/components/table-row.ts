import { expect, Page, Locator } from '@playwright/test';

export class TableRow {

  private readonly page: Page
  readonly row: Locator
  readonly name: Locator
  readonly status: Locator

  /**
   *
   * @param page required by actions menu since it's not child of the table
   * @param name of the row, has to be a link to the resource
   * @param group When there are multiple tbodies filter by group-tab
   *
   */
  constructor(page: Page, name: string, options?: {group?: string}) {
    let tbody = page.locator('table.sortable-table > tbody')
    if (options?.group) {
      tbody = tbody.filter({has: page.getByRole('cell', {name: options.group, exact: true})})
    }

    this.page = page
    this.row = tbody.locator('tr.main-row').filter({has: page.getByRole('link', {name: name, exact: true})})
    this.name = this.column('Name')
    this.status = this.column('Status')
  }

  async toBeVisible() {
    await this.row.waitFor()
  }

  async toBeActive(timeout = 200_000) {
    await expect(this.status).toHaveText('Active', {timeout: timeout})
  }

  column(name: string) {
    // https://stackoverflow.com/questions/14745478/how-to-select-table-column-by-column-header-name-with-xpath
    return this.row.locator(`xpath=/td[count(ancestor::table[1]/thead/tr/th[normalize-space(.)="${name}"]/preceding-sibling::th)+1]`)
  }

  async action(name: string) {
    // Alternative: locator(`button[id$='+${name}']`) - id="actionButton+0+rancher-kubewarden-controller"
    await this.row.locator('button.actions').click()
    await this.page.getByRole('listitem').getByText(name, {exact: true}).click()
  }

  async delete() {
    await this.action('Delete')
    await this.page.getByTestId('prompt-remove-confirm-button').click()
    await expect(this.row).not.toBeVisible();
  }

  async open() {
    await this.name.getByRole('link').click()
  }

}
