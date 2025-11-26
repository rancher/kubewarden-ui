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
  readonly page      : Page
  readonly codeMirror: Locator

  constructor(page: Page) {
    this.page = page
    this.codeMirror = page.locator('div.CodeMirror-code')
  }

  // ==================================================================================================

  // Button
  button(name: string|RegExp) {
    return this.page.getByRole('button', { name, exact: true })
      .or(this.page.locator('a.btn,button', { has: this.page.getByText(name, { exact: true }) }))
      .filter({ visible: true })
      .describe(`Button: ${name}`)
  }

  // Labeled Input
  input(label: string|RegExp) {
    return this.page.locator('div.labeled-input')
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .locator('input')
      .filter({ visible: true })
      .describe(`Input: ${label}`)
  }

  // Labeled Checkbox
  checkbox(label: string) {
    return this.page.locator('label.checkbox-container')
      .filter({ hasText: label })
      .locator('span.checkbox-custom')
      .describe(`Checkbox: ${label}`)
  }

  // Tab
  tab(name: string|RegExp) {
    return this.page.getByRole('tab', { name, exact: true }).describe(`Tab: ${name}`)
  }

  // Radio group
  radioGroup(label: string) {
    // Exact name with optional "i" tooltip
    const groupLabel = new RegExp(`^${label} .?$`)
    return this.page.locator('.radio-group')
      .filter({ has: this.page.getByRole('heading', { name: groupLabel }) })
      .locator('xpath=./following-sibling::div')
      .describe(`Radio group: ${label}`)
  }

  // Radio input (span)
  radio(label: string, name: string): Locator {
    return this.radioGroup(label).getByRole('radio', { name }).describe(`Radio: ${name} in ${label}`)
  }

  // (un)Labeled Select (ComboBox)
  select(label: string|Locator) {
    const base = (typeof label === 'string')
      ? this.page.locator('div.labeled-select').filter({ hasText: label })
      : label.locator('div.unlabeled-select')

    return base.getByRole('combobox', { name: 'Search for option' }).describe(`Select: ${label}`)
  }

  // Slide-in drawer or old config
  async showConfiguration() {
    const configBtn = RancherUI.isVersion('>=2.12') ? 'Show Configuration' : 'Config'
    await this.button(configBtn).click()
  }

  // Handling for second "Close" button on policy readme
  async hideConfiguration() {
    if (RancherUI.isVersion('>=2.12'))
      await this.button(/^Close.*Configuration drawer$/).last().click()
  }

  // Select option from (un)labeled Select
  async selectOption(label: string|Locator, option: string | RegExp | number) {
    const select = (typeof label === 'string')
      ? this.select(label)
      : (await label.getAttribute('role') === 'combobox')
          ? label
          : this.select(label)
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
   * String patch (contains ':')
   *   await editYaml('{"policyServer": {"telemetry": { "enabled": false }}}')
   * String value
   *   await editYaml('any value will be pasted as string')
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
    // If patch is a string but not JSON, insert it as-is
    await this.page.keyboard.insertText(
      typeof patch === 'string' && !patch.trim().startsWith('{') && !patch.includes(':') ? patch : jsyaml.dump(cmYaml)
    )
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
    } catch {
      test.info().annotations.push({ type: 'Retry', description: message })
      if (optReload) await this.page.reload()
      await code()
    }
  }

  static requireEnv(name: string): string {
    const value = process.env[name]
    if (!value) throw new Error(`Environment variable ${name} not set`)
    return value
  }

  static get isPrime(): boolean {
    return this.requireEnv('RANCHER_PRIME') === 'true'
  }

  static isVersion(query: string|Range): boolean {
    // Convert v2.10-6e85a811efd6b831c3d49a7336a6d4b3e96c1a93-head -> v2.10.0-head
    const version = this.requireEnv('RANCHER_VERSION').replace(/-[a-f0-9]{40}/, '.0')
    if (!semver.validRange(query)) throw new Error(`Invalid range: ${query}`)
    return semver.satisfies(version, query, { includePrerelease: true })
  }

  static get hasAppCollection(): boolean {
    // OCI repository support was added in 2.9
    return this.isPrime && this.isVersion('>=2.9') && false
  }
}
