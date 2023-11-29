import { expect, Locator } from '@playwright/test'
import { step } from '../rancher-test'
import { RancherUI } from './rancher-ui'

/**
 * Compare text of current element with parameter(s)
 * @param args
 * @returns XPath predicate: normalize-space(.)="args[0]" [or ...]
 */
function textIs(...args: string[]): string {
  return args.map(str => `normalize-space(.)="${str}"`).join(' or ')
}

/**
 * Get table column index by it's name
 * @param name Name of the table column
 * @returns XPath predicate: count(ancestor::table[1]/thead/tr/th[normalize-space(.)="Name"]/preceding-sibling::th)+1
 */
function columnIndex(...names: string[]): string {
  // Find thead > th with requested name and count how many th were before it
  return `count(ancestor::table[1]/thead/tr/th[${textIs(...names)}]/preceding-sibling::th)+1`
}

/**
 * Get table column by name and find cell with specified text
 * @param column find table column with this name
 * @param text find table cell with this text in selected column
 * @returns XPath predicate: td[count(ancestor::table[1]/thead/tr/th[normalize-space(.)="Name"]/preceding-sibling::th)+1][normalize-space(.)="podname"]
 */
function xpathColumnSelector(column: string, text: string) {
  return `xpath=td[${columnIndex(column)}][${textIs(text)}]`
}

export class TableRow {
    private readonly ui: RancherUI
    readonly row: Locator
    readonly name: Locator
    readonly status: Locator
    readonly strval: string

    /**
     *
     * @param ui Page is required by row actions menu since it's not child of the table
     * @param arg:string name of the row, looks for value under "Name" column
     * @param arg:object row value under selected column(s) {column1: "value", "column 2": "value2"}
     * @param options.group When there are multiple tbodies filter by group-tab (Project, Namespace, ..)
     */
    constructor(ui: RancherUI, arg: string | { [key: string]: string }, options?: { group?: string }) {
      let table = ui.page.locator('table.sortable-table > tbody:visible')

      // Filter by project / namespace
      if (options?.group) {
        const groupRegex = new RegExp(`^((Project|Namespace): )?${options.group}`)
        table = table.filter({ has: ui.page.getByRole('cell', { name: groupRegex }) })
      }
      let rows = table.locator('tr.main-row')

      // Filter by argument
      if (typeof arg === 'string') {
        this.strval = arg
        rows = rows.filter({ has: ui.page.locator(xpathColumnSelector('Name', arg)) })
      } else if (typeof arg === 'object') {
        this.strval = Object.keys(arg).map(key => `${key}: ${arg[key]}`).join(',')
        for (const colName in arg) {
          const colValue = arg[colName]
          rows = rows.filter({ has: ui.page.locator(xpathColumnSelector(colName, colValue)) })
        }
      }
      this.row = rows

      this.ui = ui
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
    column(...names: string[]) {
      return this.row.locator(`xpath=td[${columnIndex(...names)}]`)
    }

    async toBeVisible(options?: { timeout?: number }) {
      await this.ui.withReload(async() => {
        await expect(this.row).toBeVisible({ timeout: options?.timeout })
      }, 'Rancher showing duplicit rows')
    }

    async toHaveState(state: string, timeout = 2 * 60_000) {
      await expect(this.status).toHaveText(state, { timeout })
    }

    async toBeActive(timeout = 200_000) {
      await this.toHaveState('Active', timeout)
    }

    async action(name: string) {
      await this.row.locator('button.actions').click()
      await this.ui.page.getByRole('listitem').getByText(name, { exact: true }).click()
    }

    @step
    async delete() {
      await this.action('Delete')
      await this.ui.page.getByTestId('prompt-remove-confirm-button').click()
      await expect(this.row).not.toBeVisible()
    }

    async open() {
      await this.name.getByRole('link').click()
    }
}
