import { expect, Locator } from '@playwright/test'
import { step } from '../rancher/rancher-test'
import { RancherUI } from './rancher-ui'

export class TableRow {
  readonly row   : Locator
  readonly name  : Locator
  readonly status: Locator
  readonly strval: string = ''

  /**
     * Filter rows by column header or index. Has to be applied to this.row (tr)
     * @param index Index of the column starting from 0
     * @param name Column header name, you can provide alternative names (State|Status)
     * @returns XPath locator for table cells under column
     */
  private getByColumn(...args: (number|string)[]): Locator {
    if (typeof args[0] === 'number') {
      return this.ui.page.locator('td').nth(args[0])
    } else {
      // Compare text of column header with requested name(s)
      const filter = args.map(str => `normalize-space(.)="${str}"`).join(' or ')

      // Make sure column with header exists in the table
      const check = `ancestor::table[1]/thead/tr/th[${filter}]`
      // Get column index - find th with requested name and count th preceeding siblings. Use this count as td index.
      const index = `count(ancestor::table[1]/thead/tr/th[${filter}]/preceding-sibling::th)+1`

      // Returns: xpath=td[count(ancestor::table[1]/thead/tr/th[normalize-space(.)="Name"]/preceding-sibling::th)+1]
      return this.ui.page.locator(`xpath=td[${check}][${index}]`)
    }
  }

  /**
     *
     * @param ui Page is required by row actions menu since it's not child of the table
     * @param arg:string name of the row, looks for value under "Name" column
     * @param arg:object row value under selected column(s) {column1: "value", "column 2": "value2"}
     * @param options.group When there are multiple tbodies filter by group-tab (Project, Namespace, ..)
     */
  constructor(private readonly ui: RancherUI, arg: number | string | RegExp | { [key: string]: string | RegExp }, options?: { group?: string }) {
    // Table filter by project / namespace
    let table = ui.page.locator('table.sortable-table > tbody:visible')
    if (options?.group) {
      const groupRegex = new RegExp(`^((Project|Namespace): )?${options.group}`)
      table = table.filter({ has: ui.page.getByRole('cell', { name: groupRegex }) })
    }

    // Row filter by argument
    let rows = table.locator('tr.main-row')
    if (typeof arg === 'number') {
      this.strval = arg.toString()
      rows = rows.nth(arg)
    } else if (typeof arg === 'string' || arg instanceof RegExp) {
      this.strval = arg.toString()
      rows = rows.filter({ has: this.getByColumn('Name').getByText(arg, { exact: true }) })
    } else if (typeof arg === 'object') {
      this.strval = Object.keys(arg).map(key => `${key}: ${arg[key]}`).join(',')
      for (const colName in arg) {
        const colValue = arg[colName]
        rows = rows.filter({ has: this.getByColumn(colName).getByText(colValue, { exact: true }) })
      }
    }

    this.row = rows.describe(`TableRow: ${this}`)
    this.name = this.column('Name')
    this.status = this.column('Status', 'State')
  }

  toString() {
    return this.strval
  }

  /**
     * @param names header(s) of the column, you can provide alternative names (State|Status)
     * @returns table cell (td) that is under requested column. Returns first cell if no match was found
     */
  column(index: number): Locator
  column(name: string, ...altNames: string[]): Locator
  column(...args: (number|string)[]): Locator {
    return this.row.locator(this.getByColumn(...args)).describe(`TableRow: ${this}, Column: ${args.join('|')}`)
  }

  /**
     * Expects row to be visible and in requested state
     */
  @step
  async waitFor(options?: { state?: string, timeout?: number }): Promise<TableRow> {
    // To be visible
    await this.ui.retry(async() => {
      await expect(this.row).toBeVisible({ timeout: options?.timeout })
    }, 'Rancher showing duplicit rows')
    // Expected state
    if (options?.state) await this.toHaveState(options.state, options.timeout)

    return this
  }

  async toHaveState(state: string, timeout = 2 * 60_000) {
    await expect(this.status).toHaveText(state, { timeout })
  }

  async toBeActive(timeout = 200_000) {
    await this.toHaveState('Active', timeout)
  }

  @step
  async action(name: string|RegExp) {
    await this.row.getByTestId(/^sortable-table-\d+-action-button$/).describe(`TableRow: ${this}, Action: ${name}`).click()
    // Rancher 2.11+ uses both menuitem & listitem
    await this.ui.page.getByRole('listitem').or(this.ui.page.getByRole('menuitem'))
      .getByText(name, { exact: true }).click()
  }

  @step
  async delete(options?: { timeout?: number }) {
    await this.action('Delete')
    await this.ui.page.getByTestId('prompt-remove-confirm-button').click()
    // Table row stays visible as "Uninstalling"
    if (this.strval !== 'rancher-monitoring-crd') {
      await expect(this.row).not.toBeVisible(options)
    }
  }

  async open() {
    await this.name.getByRole('link').describe(`TableRow: ${this}`).click()
  }
}
