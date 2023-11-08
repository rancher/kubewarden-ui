import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import jsyaml from 'js-yaml'
import _ from 'lodash'
import { TableRow } from './table-row'

export type YAMLPatch = { [key: string]: unknown } | string | ((patch:any) => void)

/**
 * aria-label is not always filled - we have to use filters to find elements reliably
 */
export class RancherUI {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // ==================================================================================================

  // Button
  button(name: string) {
    return this.page.getByRole('button', { name, exact: true }).or(
      this.page.locator(`a.btn:text-is("${name}")`))
  }

  // Labeled Input
  input(label: string) {
    return this.page.locator('div.labeled-input').filter({ hasText: label }).getByRole('textbox')
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

  // Labeled Select combobox
  combobox(label: string) {
    return this.page.locator('div.labeled-select').filter({ hasText: label })
      .getByRole('combobox', { name: 'Search for option' })
  }

  // Select option from labeled select
  async select(label: string, option: string | RegExp) {
    await this.combobox(label).click()
    await this.page.getByRole('option', { name: option, exact: true }).click()
  }

  // ==================================================================================================
  // Table Handler
  getRow(arg: string | { [key: string]: string }, options?: { group?: string }): TableRow {
    return new TableRow(this, arg, options)
  }

  // ==================================================================================================
  // Helper functions

  async openView(view: 'Edit Options' | 'Edit YAML' | 'Compare Changes') {
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
  async editYaml(patch: YAMLPatch) {
    const cmEditor = this.page.locator('div.CodeMirror-lines[role="presentation"]')

    // Load yaml from code editor
    await expect(cmEditor).toBeVisible()
    const lines = await cmEditor.locator('pre.CodeMirror-line').allTextContents()
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
    await this.page.locator('.CodeMirror-code').click()
    await this.page.keyboard.press('Control+A')
    await this.page.keyboard.insertText(jsyaml.dump(cmYaml))
  }

  /**
     * Call ui.withReload(async()=> { <code> }, 'Reason')
     */
  async withReload(code: () => Promise<void>, message: string) {
    try {
      await code()
    } catch (e) {
      test.info().annotations.push({ type: 'workaround', description: `Reload: ${message}` })
      await this.page.reload()
      await code()
    }
  }
}
