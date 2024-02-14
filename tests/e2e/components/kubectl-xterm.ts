import { expect, Locator, Page } from '@playwright/test'
import { step } from '../rancher/rancher-test'
import { BaseShell } from './kubectl-base'

export class Shell extends BaseShell {
    readonly prompt: Locator
    readonly status: Locator

    constructor(page: Page) {
      super(page)
      // Last line starting with >
      this.prompt = this.screen.locator('div.xterm-rows>div:has(span)').filter({ hasText: '>' }).last()
      // Exit status of last command
      this.status = this.prompt.locator('xpath=preceding-sibling::div[1]')
    }

    @step
    async run(cmd: string, options?: { status?: number, inPlace?: boolean, timeout?: number }): Promise<number> {
      const status = options?.status ?? 0
      const timeout = options?.timeout || 60_000

      if (!options?.inPlace) await this.open()

      // Fill is faster but removes newlines, multiline commands require input.pressSequentially
      await this.cursor.fill(`${cmd}; echo EXITSTATUS-$?`)
      await this.cursor.press('Enter')

      // Wait - command finished when prompt is empty
      await expect(this.prompt.getByText(/^>\s+$/)).toBeVisible({ timeout })
      // Verify command exit status
      const statusText = await this.status.textContent() || 'Error'
      const statusCode = parseInt(statusText.replace(/EXITSTATUS-/, ''))
      if (isFinite(status)) expect(statusCode).toBe(status)

      if (!options?.inPlace) await this.close()
      return statusCode
    }
}
