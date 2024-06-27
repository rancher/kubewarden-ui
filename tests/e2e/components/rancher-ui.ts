import semver, { Range } from 'semver'
import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import jsyaml from 'js-yaml'
import _ from 'lodash'
import { step } from '../rancher/rancher-test'
import { TableRow } from './table-row'

export type YAMLPatch = { [key: string]: unknown } | string | ((patch:any) => void)

/**
 * aria-label is not always filled - we have to use filters to find elements reliably
 */
export class RancherUI {
  readonly page: Page
  readonly codeMirror: Locator

  constructor(page: Page) {
    this.page = page
    this.codeMirror = page.locator('div.CodeMirror-code')
  }

  // ==================================================================================================

  // Button
  button(name: string|RegExp) {
    return this.page.getByRole('button', { name, exact: true }).or(
      this.page.locator('a.btn').filter({ has: this.page.getByText(name, { exact: true }) })
    )
  }

  // Labeled Input
  input(label: string|RegExp) {
    return this.page.locator('div.labeled-input')
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .locator('input')
  }

  // Labeled Checkbox
  checkbox(label: string) {
    return this.page.locator('label.checkbox-container')
      .filter({ hasText: label })
      .locator('span.checkbox-custom')
  }

  // Tab
  tab(name: string) {
    return this.page.getByRole('tab', { name, exact: true })
  }

  // Radio group
  radioGroup(label: string) {
    // Exact name with optional "i" tooltip
    const groupLabel = new RegExp(`^${label} .?$`)
    return this.page.locator('.radio-group')
      .filter({ has: this.page.getByRole('heading', { name: groupLabel }) })
      .locator('xpath=./following-sibling::div')
  }

  // Radio input (span)
  radio(label: string, name: string): Locator {
    return this.radioGroup(label).getByRole('radio', { name })
  }

  // Labeled Select (ComboBox)
  select(label: string) {
    return this.page.locator('div.labeled-select').filter({ hasText: label })
      .getByRole('combobox', { name: 'Search for option' })
  }

  // Select option from (un)labeled Select
  async selectOption(label: string|Locator, option: string | RegExp | number) {
    const select = (typeof label === 'string') ? this.select(label) : label.getByRole('combobox', { name: 'Search for option' })
    await select.click()

    const optionItem = typeof option === 'number'
      ? this.page.getByRole('option').nth(option)
      : this.page.getByRole('option', { name: option, exact: true })
    await optionItem.click()
  }

  // ==================================================================================================
  // Table Handler
  tableRow(arg: number | string | RegExp | { [key: string]: string | RegExp }, options?: { group?: string }): TableRow {
    return new TableRow(this, arg, options)
  }

  // ==================================================================================================
  // Helper functions

  async openView(view: 'Edit Options' | 'Edit YAML' | 'Edit as YAML' | 'Compare Changes') {
    // Give generated fields time to get registered
    await this.page.waitForTimeout(200)
    // Show yaml with edited settings
    await this.button(view).click()
  }

  /**
   * Usage:
   * Yaml nodes are not created automatically, checks presence of the structure
   *   await editYaml((y) => { y.policyServer.telemetry.enabled = false })
   * Yaml nodes are created automatically
   *   await editYaml({ 'policyServer.telemetry.enabled': false })
   * String patch
   *   await editYaml('{"policyServer": {"telemetry": { "enabled": false }}}')
   */
  @step
  async editYaml(patch: YAMLPatch) {
    // Load yaml from code editor
    await expect(this.codeMirror).toBeVisible()
    const lines = await this.codeMirror.locator('pre.CodeMirror-line').allTextContents()
    const cmYaml = jsyaml.load(lines.join('\n')
      .replace(/\u00A0/g, ' ') // replace &nbsp; with space
      .replace(/\u200B/g, '') // remove ZERO WIDTH SPACE last line
    ) || {}

    // Edit yaml
    if (typeof patch === 'function') {
      patch(cmYaml)
    } else if (typeof patch === 'string') {
      _.merge(cmYaml, jsyaml.load(patch))
    } else if (typeof patch === 'object') {
      Object.keys(patch).forEach((key) => {
        _.set(cmYaml, key, patch[key])
      })
    }

    // Paste edited yaml
    await this.codeMirror.click()
    await this.page.keyboard.press('Control+A')
    await this.page.keyboard.insertText(jsyaml.dump(cmYaml))
  }

  @step
  async importYaml(yaml: YAMLPatch) {
    // Open import dialog
    const dialog = this.page.getByRole('dialog')
    await this.page.locator('header').locator('button').filter({ has: this.page.locator('i.icon-upload') }).click()
    await expect(dialog.getByRole('heading', { name: 'Import YAML', exact: true })).toBeVisible()

    // Paste yaml
    await this.editYaml(yaml)
    await this.button('Import').click()
    await expect(dialog.getByRole('heading', { name: /^Applied \d+ Resources?$/ })).toBeVisible()

    // Wait until all resources are active
    await dialog.getByTestId('sortable-cell-0-0').waitFor()
    for (const e of await dialog.getByTestId(/sortable-cell-\d+-0/).all()) {
      await expect(e).toHaveText('Active', { timeout: 60_000 })
    }

    // Close dialog
    await this.button('Close').click()
  }

  /**
     * Call await ui.retry(async()=> { <code> }, 'Reason')
     */
  async retry(code: () => Promise<void>, message: string, options?: { reload?: boolean }) {
    const optReload = options?.reload || true
    try {
      await code()
    } catch (e) {
      test.info().annotations.push({ type: 'Retry', description: message })
      if (optReload) await this.page.reload()
      await code()
    }
  }

  static get isPrime(): boolean {
    if (!process.env.RANCHER_PRIME) throw new Error('RANCHER_PRIME not set')
    return process.env.RANCHER_PRIME === 'true'
  }

  static isVersion(query: string|Range): boolean {
    if (!process.env.RANCHER_VERSION) throw new Error('RANCHER_VERSION not set')
    if (!semver.validRange(query)) throw new Error(`Invalid range: ${query}`)
    return semver.satisfies(process.env.RANCHER_VERSION, query, { includePrerelease: true })
  }

  static get hasAppCollection(): boolean {
    return this.isVersion('>=2.9') // && this.isPrime
  }
}
