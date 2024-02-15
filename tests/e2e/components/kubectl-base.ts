import { expect, Locator, Page } from '@playwright/test'

import { step } from '../rancher/rancher-test'
import { Policy, PolicyKind } from '../pages/policies.page'

export abstract class BaseShell {
    private readonly win: Locator
    readonly screen: Locator
    readonly cursor: Locator
    readonly connected: Locator

    constructor(protected readonly page: Page) {
      // Window manager owns kubectl tab
      this.win = this.page.locator('div#windowmanager')
      // Connected message
      this.connected = this.win.locator('.status').getByText('Connected', { exact: true })
      // Visible terminal screen
      this.screen = this.win.locator('div.xterm-screen')
      // Textarea where we type commands
      this.cursor = this.screen.getByLabel('Terminal input', { exact: true })
    }

    // Open terminal
    async open() {
      await this.page.locator('#btn-kubectl').click()
      await expect(this.connected).toBeVisible({ timeout: 30_000 })
      await expect(this.win.locator('div.shell-container.open')).toBeVisible()
    }

    // Close terminal
    async close() {
      await this.win.locator('.tab', { hasText: 'Kubectl:' }).locator('i.closer').click()
    }

    /**
     * Execute single command in shell, opens and closes it by default
     * @param cmd shell command to execute
     * @param options.status expected exit code to check, defaults to 0. If NaN check is skipped
     * @param options.timeout for command to finish defaults to 60s
     * @param options.inPlace it true kubectl shell is already opened
     * @returns exit status from executed command
     */
    abstract run(cmd: string, options?: { status?: number, inPlace?: boolean, timeout?: number }): Promise<number>

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
      const tries = options?.tries || 2 * 6
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

    async waitPods(options?: { ns?: string, filter?: string }) {
      const ns = options?.ns || '-n cattle-kubewarden-system'
      const filter = options?.filter || ''
      await this.retry(`kubectl get pods --no-headers ${ns} ${filter} 2>&1 | sed -E '/([0-9]+)[/]\\1\\s+Running|Completed/d' | wc -l | grep -qx 0`)
    }

    async privpod(options?: { name?: string, ns?: string, status?: number }) {
      const name = options?.name || `privpod-${Date.now()}`
      const ns = options?.ns ? `-n ${options.ns}` : ''
      await this.run(`k run ${name} --image=busybox --command --restart=Never -it --rm --privileged ${ns} -- true`, options)
    }

    async waitPolicyState(p: Policy, kind: PolicyKind, state?: 'PolicyActive' | 'PolicyUniquelyReachable') {
      const nsarg = (kind === 'AdmissionPolicy' && p.namespace) ? `-n ${p.namespace}` : ''
      await this.run(`kubectl wait --timeout=5m --for=condition=${state || 'PolicyUniquelyReachable'} ${nsarg} ${kind} ${p.name} `)
    }
}
