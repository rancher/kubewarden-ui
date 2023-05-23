import type { Page } from '@playwright/test';
import jsyaml from 'js-yaml';
import merge from 'lodash.merge';
import { TableRow } from '../components/table-row';

/**
 * aria-label is not always filled - we have to use filters to find elements reliably
 */
export class RancherUI {

    constructor(public readonly page: Page) {}

    // ==================================================================================================
    // https://vuetifyjs.com/en/components/checkboxes/#checkboxes

    // button shortcut
    button(name: string) {
        return this.page.getByRole('button', {name: name, exact: true})
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

    // Labeled Select
    async select(label: string, option: string) {
        await this.page.locator('div.labeled-select')
            .filter({hasText: label})
            .getByRole('combobox', { name: 'Search for option' }).click()
        await this.page.getByRole('option', { name: option, exact: true }).click()
    }

    // ==================================================================================================
    // Table Handler

    getRow(name: string) {
        return new TableRow(this.page, name)
    }

    // ==================================================================================================
    // Helper functions

    /**
     * Build regex matching successfull chart installation
     */
    helmPassRegex(name: string) {
        const re = new RegExp(`SUCCESS: helm .* ${name} \/home`)
        return this.page.locator('.logs-container').getByText(re)
    }

    /**
     * Usage:
     * await editYaml(page, d => d.telemetry.enabled = true )
     * await editYaml(page, '{"policyServer": {"telemetry": { "enabled": false }}}')
     */
    async editYaml(page: Page, source: Function|string) {
        // Load yaml from code editor
        const lines = await page.locator('.CodeMirror-code > div > pre.CodeMirror-line').allTextContents();
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
        await page.locator('.CodeMirror-code').click()
        await page.keyboard.press('Control+A');
        await page.keyboard.insertText(jsyaml.dump(cmYaml))
    }

}
