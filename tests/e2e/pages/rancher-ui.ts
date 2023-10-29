import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import jsyaml from 'js-yaml';
import merge from 'lodash.merge';
import { TableRow } from '../components/table-row';

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
    radio(label: string, name: string) {
        // Exact name with optional "i" tooltip
        const groupLabel = new RegExp(`^${label} .?$`)
        return this.page.locator('.radio-group')
            .filter({has: this.page.getByRole('heading', {name: groupLabel})})
            .locator('xpath=./following-sibling::div')
            .getByRole('radio', {name: name})
    }

    // Labeled Select
    async select(label: string, option: string|RegExp) {
        await this.page.locator('div.labeled-select')
            .filter({hasText: label})
            .getByRole('combobox', { name: 'Search for option' }).click()
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
     * Execute commands in kubectl shell, can process single-line commands
     * @param commands execute, have to finish with 0 exit code
     */
    async shell(...commands: string[]) {
        const win = this.page.locator('#windowmanager')
        const prompt = win.locator('.xterm-rows>div:has(span)').filter({hasText: ">"}).last()
        const input = win.getByLabel('Terminal input', {exact: true})

        // Open terminal
        await this.page.locator('#btn-kubectl').click()
        await expect(win.locator('.status').getByText('Connected', {exact: true})).toBeVisible({timeout: 30_000})
        // Run command
        for (const cmd of commands) {
            // Fill removes newlines, multiline commands require input.pressSequentially
            await input.fill(cmd + ' || echo ERREXIT-$?')
            await input.press('Enter')
            // Wait - command finished when prompt is empty
            await expect(prompt.getByText(/^>\s+$/)).toBeVisible({timeout: 5*60_000})
            // Verify command exit status
            await expect(win.getByText(/ERREXIT-[0-9]+/), {message: 'Shell command finished with an error'}).not.toBeVisible({timeout: 1})
        }
        // Close terminal
        await win.locator('.tab').filter({hasText: 'Kubectl: local'}).locator('i.closer').click()
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
