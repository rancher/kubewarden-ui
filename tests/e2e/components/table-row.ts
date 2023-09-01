import { expect, Locator } from '@playwright/test';
import { RancherUI } from '../pages/rancher-ui';

export class TableRow {

  private readonly ui: RancherUI
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
  constructor(ui: RancherUI, name: string, options?: {group?: string}) {
    let tbody = ui.page.locator('table.sortable-table > tbody')
    if (options?.group) {
      tbody = tbody.filter({has: ui.page.getByRole('cell', {name: options.group, exact: true})})
    }

    this.ui = ui
    this.row = tbody.locator('tr.main-row').filter({has: ui.page.getByRole('link', {name: name, exact: true})})
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

  column(...names: string[]) {
    // Generate selector from column names
    const selector = names.map(str => `normalize-space(.)="${str}"`).join(" or ")
    // https://stackoverflow.com/questions/14745478/how-to-select-table-column-by-column-header-name-with-xpath
    return this.row.locator(`xpath=/td[count(ancestor::table[1]/thead/tr/th[${selector}]/preceding-sibling::th)+1]`)
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
