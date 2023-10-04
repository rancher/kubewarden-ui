import { expect, Locator } from '@playwright/test';
import { RancherUI } from '../pages/rancher-ui';

/**
 * Builds xpath expression to get column index by it's name
 * @param name Name of the table column
 * @returns xpath expression to get index of the column
 */
function xpath_colIndex(...names: string[]):string {
  // Transform: names > normalize-space(.)="names[0]" [or ...]
  const selector = names.map(str => `normalize-space(.)="${str}"`).join(" or ")
  // Find thead > th with requested name and count how many th was before it
  return `count(ancestor::table[1]/thead/tr/th[${selector}]/preceding-sibling::th)+1`
}

export class TableRow {

  private readonly ui: RancherUI
  readonly row: Locator
  readonly name: Locator
  readonly status: Locator

  /**
   *
   * @param page is required by row actions menu since it's not child of the table
   * @param name of the row, it is searched under "Name" column by default
   * @param group When there are multiple tbodies filter by group-tab
   *
   */
  constructor(ui: RancherUI, name: string, options?: {group?: string}) {
    let tbody = ui.page.locator('table.sortable-table > tbody')
    if (options?.group) {
      tbody = tbody.filter({has: ui.page.getByRole('cell', {name: options.group, exact: true})})
    }

    this.ui = ui
    this.row = tbody.locator(`xpath=tr[td[${xpath_colIndex("Name")}][normalize-space(.)="${name}"]]`)
    this.name = this.column('Name')
    this.status = this.column('Status', 'State')
  }

  async toBeVisible() {
    await this.ui.withReload(async()=> {
      await expect(this.row).toBeVisible()
    }, 'Rancher showing duplicit rows')
  }

  async toBeActive(timeout = 200_000) {
    await expect(this.status).toHaveText('Active', {timeout: timeout})
  }

  /**
   * @param names header of the column, you can provide alternative names (State|Status)
   * @returns table cell (td) that is under requested column. Returns first cell if no match was found
   */
  column(...names: string[]) {
      return this.row.locator(`xpath=td[${xpath_colIndex(...names)}]`)
  }

  async action(name: string) {
    await this.row.locator('button.actions').click()
    await this.ui.page.getByRole('listitem').getByText(name, {exact: true}).click()
  }

  async delete() {
    await this.action('Delete')
    await this.ui.page.getByTestId('prompt-remove-confirm-button').click()
    await expect(this.row).not.toBeVisible();
  }

  async open() {
    await this.name.getByRole('link').click()
  }

}
