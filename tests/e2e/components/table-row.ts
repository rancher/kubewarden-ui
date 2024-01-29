import { expect, Locator } from '@playwright/test'
import { step } from '../rancher/rancher-test'
import { RancherUI } from './rancher-ui'

export class TableRow {
    readonly row: Locator
    readonly name: Locator
    readonly status: Locator
    readonly strval: string

    /**
     * Filter cells for requested column. Has to be applied to this.row (tr)
     * Based on column counting - find th with requested name and count th preceeding siblings. Use this count as td index.
     * @param name exact name of the table column
     * @returns XPath locator for table cells under column. Returns first column if not found
     */
    private findColumn(...names: string[]): Locator {
      // Compare text of column header with parameter(s)
      const filter = names.map(str => `normalize-space(.)="${str}"`).join(' or ')
      // Returns: xpath=td[count(ancestor::table[1]/thead/tr/th[normalize-space(.)="Name"]/preceding-sibling::th)+1]
      return this.ui.page.locator(`xpath=td[count(ancestor::table[1]/thead/tr/th[${filter}]/preceding-sibling::th)+1]`)
    }

    // Locator to filter rows by [column & name] value. Has to be applied to this.row (tr)
    private findCell(columnName: string, name: string | RegExp): Locator {
      return this.findColumn(columnName).filter({ has: this.ui.page.getByText(name, { exact: true }) })
    }

    /**
     *
     * @param ui Page is required by row actions menu since it's not child of the table
     * @param arg:string name of the row, looks for value under "Name" column
     * @param arg:object row value under selected column(s) {column1: "value", "column 2": "value2"}
     * @param options.group When there are multiple tbodies filter by group-tab (Project, Namespace, ..)
     */
    constructor(private readonly ui: RancherUI, arg: string | RegExp | { [key: string]: string | RegExp }, options?: { group?: string }) {
      let table = ui.page.locator('table.sortable-table > tbody:visible')

      // Filter by project / namespace
      if (options?.group) {
        const groupRegex = new RegExp(`^((Project|Namespace): )?${options.group}`)
        table = table.filter({ has: ui.page.getByRole('cell', { name: groupRegex }) })
      }
      let rows = table.locator('tr.main-row')

      // Filter by argument
      if (typeof arg === 'string' || arg instanceof RegExp) {
        this.strval = arg.toString()
        rows = rows.filter({ has: this.findCell('Name', arg) })
      } else if (typeof arg === 'object') {
        this.strval = Object.keys(arg).map(key => `${key}: ${arg[key]}`).join(',')
        for (const colName in arg) {
          const colValue = arg[colName]
          rows = rows.filter({ has: this.findCell(colName, colValue) })
        }
      }

      this.row = rows
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
    column(...names: string[]): Locator {
      return this.row.locator(this.findColumn(...names))
    }

    /**
     * Expects row to be visible and in requested state
     */
    @step
    async waitFor(options?: { state?: string, timeout?: number }): Promise<TableRow> {
      // To be visible
      await this.ui.withReload(async() => {
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
    async action(name: string) {
      await this.row.locator('button.actions').click()
      await this.ui.page.getByRole('listitem').getByText(name, { exact: true }).click()
    }

    @step
    async delete(options?: { timeout?: number }) {
      await this.action('Delete')
      await this.ui.page.getByTestId('prompt-remove-confirm-button').click()
      await expect(this.row).not.toBeVisible(options)
    }

    async open() {
      await this.name.getByRole('link').click()
    }
}
