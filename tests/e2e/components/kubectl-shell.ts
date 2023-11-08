import { expect, Locator, Page } from '@playwright/test'
import { step } from '../rancher-test'
import { Policy, PolicyKind } from '../pages/policies.page'

export class Shell {
    readonly win: Locator
    readonly prompt: Locator
    readonly cursor: Locator
    readonly status: Locator

    constructor(private readonly page: Page) {
      this.win = this.page.locator('div#windowmanager')
      // Last line starting with >
      this.prompt = this.win.locator('div.xterm-rows>div:has(span)').filter({ hasText: '>' }).last()
      // Textarea where we type commands
      this.cursor = this.win.getByLabel('Terminal input', { exact: true })
      // Exit status of last command
      this.status = this.prompt.locator('xpath=preceding-sibling::div[1]')
    }

    // Open terminal
    async open() {
      await this.page.locator('#btn-kubectl').click()
      await expect(this.win.locator('.status').getByText('Connected', { exact: true })).toBeVisible({ timeout: 30_000 })
      await expect(this.prompt).toBeVisible()
    }

    // Close terminal
    async close() {
      await this.win.locator('.tab').filter({ hasText: 'Kubectl: local' }).locator('i.closer').click()
    }

    /**
     * Execute single command in shell, opens and closes it by default
     * @param cmd shell command to execute
     * @param options.status expected exit code to check, defaults to 0. If NaN check is skipped
     * @param options.timeout for command to finish defaults to 60s
     * @param options.inPlace it true kubectl shell is already opened
     * @returns exit status from executed command
     */
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

    /**
     * Execute one or more shell commands
     * @param commands to run. They are checked for success.
     */
    async runBatch(...commands: string[]) {
      await this.open()
      for (const cmd of commands) {
        await this.run(cmd, { inPlace: true })
      }
      await this.close()
    }

    /**
     * Executes command until it returns 0 exit status
     * @param cmd shell command to run in a loop
     * @param options.delay delay between retries in seconds
     * @param options.tries number of retries
     */
    @step
    async retry(cmd: string, options?: { delay?: number, tries?: number }) {
      const tries = options?.tries || 6
      const delay = options?.delay || 10

      await this.open()
      for (let i = 1; i < tries; i++) {
        // If command passed break retry loop
        if (await this.run(cmd, { status: NaN, inPlace: true }) === 0) break
        // If command failed wait before trying again
        await this.page.waitForTimeout(delay * 1000)
        // Final try
        if (i === tries - 1) await this.run(cmd, { inPlace: true })
      }
      await this.close()
    }

    async privpod(options?: { ns?: string, status?: number }) {
      const nsarg = options?.ns ? `-n ${options.ns}` : ''
      await this.run(`k run privpod-${Date.now()} --image=busybox --command --restart=Never -it --rm --privileged ${nsarg} -- true`, options)
    }

    async waitPolicyState(p: Policy, kind: PolicyKind, state?: 'PolicyActive' | 'PolicyUniquelyReachable') {
      const nsarg = (kind === 'AdmissionPolicy' && p.namespace) ? `-n ${p.namespace}` : ''
      await this.run(`kubectl wait --timeout=5m --for=condition=${state || 'PolicyUniquelyReachable'} ${nsarg} ${kind} ${p.name} `)
    }
}
