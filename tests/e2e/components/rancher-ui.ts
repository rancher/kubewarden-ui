import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import jsyaml from 'js-yaml';
import merge from 'lodash.merge';
import { TableRow } from './table-row';

/**
 * aria-label is not always filled - we have to use filters to find elements reliably
 */
export class RancherUI {

    constructor(public readonly page: Page) { }

    // ==================================================================================================

    // Button
    button(name: string) {
        return this.page.getByRole('button', {name: name, exact: true}).or(
            this.page.locator(`a.btn:text-is("${name}")`))
    }

    // Labeled Input
    input(label: string) {
        return this.page.locator('div.labeled-input').filter({hasText: label}).getByRole('textbox')
    }

    // Labeled Checkbox
    checkbox(label: string) {
        return this.page.locator('label.checkbox-container')
            .filter({hasText: label})
            .locator('span.checkbox-custom')
    }

    // Radio group
    radioGroup(label: string) {
        // Exact name with optional "i" tooltip
        const groupLabel = new RegExp(`^${label} .?$`)
        return this.page.locator('.radio-group')
            .filter({has: this.page.getByRole('heading', {name: groupLabel})})
            .locator('xpath=./following-sibling::div')
    }

    // Radio input (span)
    radio(label: string, name: string) {
        return this.radioGroup(label).getByRole('radio', {name: name})
    }

    // Labeled Select combobox
    combobox(label: string) {
        return this.page.locator('div.labeled-select').filter({hasText: label})
            .getByRole('combobox', { name: 'Search for option' })
    }

    // Select option from labeled select
    async select(label: string, option: string|RegExp) {
        await this.combobox(label).click()
        await this.page.getByRole('option', { name: option, exact: true }).click()
    }

    // ==================================================================================================
    // Table Handler
    getRow(arg: string | { [key: string]: string }, options?: {group?: string}) {
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
     * await editYaml(d => d.telemetry.enabled = true )
     * await editYaml('{"policyServer": {"telemetry": { "enabled": false }}}')
     */
    async editYaml(source: Function|string) {
        const cmEditor = this.page.locator('div.CodeMirror-lines[role="presentation"]')

        // Load yaml from code editor
        await expect(cmEditor).toBeVisible()
        const lines = await cmEditor.locator('pre.CodeMirror-line').allTextContents()
        let cmYaml = jsyaml.load(lines.join('\n')
            .replace(/\u00a0/g, " ")  // replace &nbsp; with space
            .replace(/\u200b/g, "")   // remove ZERO WIDTH SPACE last line
        );

        // Edit yaml
        if (source instanceof Function) {
            source(cmYaml)
        } else {
            merge(cmYaml, jsyaml.load(source))
        }
        // Paste edited yaml
        await this.page.locator('.CodeMirror-code').click()
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.insertText(jsyaml.dump(cmYaml))
    }

    /**
     * Call ui.withReload(async()=> { <code> }, 'Reason')
     */
    async withReload(code: () => Promise<void>, message?: string): Promise<void> {
        try {
            await code();
        } catch (e) {
            if (message) console.log(`Reload: ${message}`)
            await this.page.reload();
            await code();
        }
    }

}
