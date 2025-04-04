import { execSync } from 'child_process'
import { expect, test, Locator, Page } from '@playwright/test'
import { step } from '../rancher/rancher-test'
import { Policy, PolicyKind } from '../pages/policies.page'
import { RancherUI } from './rancher-ui'

type Runner = 'rancher' | 'nodejs'

export class Shell {
  private readonly win: Locator
  readonly screen     : Locator
  readonly cursor     : Locator
  readonly connected  : Locator
  // Xterm locators
  readonly prompt     : Locator
  readonly status     : Locator

  constructor(protected readonly page: Page) {
    // Window manager owns kubectl tab
    this.win = this.page.locator('div#windowmanager')
    // Connected message
    this.connected = this.win.locator('.status').getByText('Connected', { exact: true })
    // Visible terminal screen
    this.screen = this.win.locator('div.xterm-screen')
    // Textarea where we type commands
    this.cursor = this.screen.getByLabel('Terminal input', { exact: true })
    // Last line starting with >
    this.prompt = this.screen.locator('div.xterm-rows>div:has(span)').filter({ hasText: '>' }).last()
    // Exit status of last command
    this.status = this.prompt.locator('xpath=preceding-sibling::div[1]')
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
     * Wrapper for invidual shell implementations
     * @param cmd shell command to execute
     * @param options.status expected exit code to check, defaults to 0. If NaN check is skipped
     * @param options.timeout for command to finish, defaults to 60s
     * @param options.inPlace if true shell is extected to be already open
     * @param options.runner which runner should execute command, defaults to rancher shell
     * @returns exit status from executed command
     */
  @step
  async run(cmd: string, options?: { status?: number, inPlace?: boolean, timeout?: number, runner?: Runner }): Promise<number> {
    const runner = options?.runner || 'rancher'

    switch (runner) {
      case 'nodejs': return this.runExec(cmd, options)
      case 'rancher':
        if (RancherUI.isVersion('>=2.9')) {
          return await this.runCanvas(cmd, options)
        } else {
          return await this.runXterm(cmd, options)
        }
    }
  }

  /**
     * Execute command in rancher shell (canvas)
     */
  async runCanvas(cmd: string, options?: { status?: number, inPlace?: boolean, timeout?: number }): Promise<number> {
    const status = options?.status ?? 0
    const timeout = options?.timeout || 60_000

    if (!options?.inPlace) await this.open()

    // Fill is faster but removes newlines, multiline commands require input.pressSequentially
    await this.cursor.fill(`${cmd}; ES=$?; clear; echo EXITSTATUS-$ES`)
    await this.cursor.press('Enter')

    const canvas = this.screen.locator('canvas.xterm-link-layer')
    const box = await canvas.boundingBox() || { x: 72, y: 481 }
    const clip = { x: box.x, y: box.y, width: 100, height: 14 }

    // Command finished when we see EXITSTATUS-
    await expect(async() => {
      await expect(this.page).toHaveScreenshot('shell/EXITSTATUS-NaN.png', { clip: { ...clip, width: 77 } })
    }).toPass({ timeout, intervals: [500, 1_000, 5_000] })

    let statusCode = NaN
    if (isFinite(status)) {
      // Verify command exit status
      await expect(this.page).toHaveScreenshot(`shell/EXITSTATUS-${status}.png`, { clip })
      statusCode = status
    } else {
      // Return exit status 0 if command passed (for retries)
      try {
        await expect(this.page).toHaveScreenshot('shell/EXITSTATUS-0.png', { clip })
        statusCode = 0
      } catch {}
    }

    if (!options?.inPlace) await this.close()
    else await this.cursor.press('Control+l')

    return statusCode
  }

  /**
     * Execute command in rancher shell (xterm)
     */
  async runXterm(cmd: string, options?: { status?: number, inPlace?: boolean, timeout?: number }): Promise<number> {
    const status = options?.status ?? 0
    const timeout = options?.timeout || 60_000

    if (!options?.inPlace) {
      await this.open()
      await expect(this.prompt).toHaveText(/^>\s+$/)
    }

    // Fill is faster but removes newlines, multiline commands require input.pressSequentially
    await this.cursor.fill(`${cmd}; echo EXITSTATUS-$?`)
    await this.cursor.press('Enter')

    // Wait - command finished when prompt is empty
    await expect(this.prompt).toHaveText(/^>\s+$/, { timeout })
    // Verify command exit status
    const statusText = await this.status.textContent() || 'Error'
    const statusCode = parseInt(statusText.replace(/EXITSTATUS-/, ''))
    if (isFinite(status)) expect(statusCode).toBe(status)

    if (!options?.inPlace) await this.close()
    return statusCode
  }

  /**
     * Execute in nodejs shell
     * Could produce differents results from Rancher shell since it's running on host os
     */
  runExec(cmd: string, options?: { status?: number, timeout?: number }): number {
    const status = options?.status ?? 0
    const timeout = options?.timeout || 60_000

    let cmdStatus = 0
    let cmdOutput: string
    try {
      cmdOutput = execSync(cmd, { timeout }).toString()
    } catch (e) {
      cmdStatus = e.status
      cmdOutput = e.stderr.toString()
    }
    test.info().annotations.push({ type: `runExec [${cmdStatus}]`, description: cmdOutput })

    if (isFinite(status)) expect(cmdStatus).toBe(status)
    return cmdStatus
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
     * @param options.timeout time in seconds, guess short for delay * tries
     */
  @step
  async retry(cmd: string, options?: { delay?: number, tries?: number, timeout?: number, runner?: Runner, inPlace?: boolean }) {
    const delay = options?.delay || (options?.timeout ? Math.sqrt(options.timeout) : 10)
    const tries = options?.tries || (options?.timeout ? options.timeout / delay : 5 * 6)
    const runner = options?.runner || 'nodejs'

    if (runner === 'rancher' && !options?.inPlace) await this.open()
    for (let i = 1; i < tries; i++) {
      // If command passed break retry loop
      if (await this.run(cmd, { status: NaN, inPlace: true, runner }) === 0) break
      // If command failed wait before trying again
      await this.page.waitForTimeout(delay * 1000)
      // Final try
      if (i === tries - 1) await this.run(cmd, { inPlace: true, runner })
    }
    if (runner === 'rancher' && !options?.inPlace) await this.close()
  }

  @step
  async waitPods(options?: { ns?: string, filter?: string, timeout?: number }) {
    const ns = options?.ns || '-n cattle-kubewarden-system'

    const filter = options?.filter || ''
    await this.retry(`kubectl get pods --no-headers ${ns} ${filter} 2>&1 | sed -E '/([0-9]+)[/]\\1\\s+Running|Completed/d' | wc -l | grep -qx 0`, options)
  }

  @step
  privpod(options?: { name?: string, ns?: string, status?: number }) {
    const name = options?.name || `privpod-${Date.now()}`
    const ns = options?.ns ? `-n ${options.ns}` : ''
    this.runExec(`kubectl run ${name} --image=busybox --command --restart=Never -it --rm --privileged ${ns} -- true`, options)
  }

  @step
  waitPolicyState(p: Policy, kind: PolicyKind, state?: 'PolicyActive' | 'PolicyUniquelyReachable') {
    const nsarg = (kind === 'AdmissionPolicy' && p.namespace) ? `-n ${p.namespace}` : ''
    this.runExec(`kubectl wait --timeout=5m --for=condition=${state || 'PolicyUniquelyReachable'} ${nsarg} ${kind} ${p.name} `)
  }
}
