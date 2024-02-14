import { expect, Locator, Page } from '@playwright/test'

import { step } from '../rancher/rancher-test'
import { BaseShell } from './kubectl-base'

export class Shell extends BaseShell {
    readonly canvas: Locator

    constructor(page: Page) {
      super(page)
      this.canvas = this.screen.locator('canvas.xterm-link-layer')
    }

    @step
    async run(cmd: string, options?: { status?: number, inPlace?: boolean, timeout?: number }): Promise<number> {
      const status = options?.status ?? 0
      const timeout = options?.timeout || 60_000

      if (!options?.inPlace) await this.open()

      // Fill is faster but removes newlines, multiline commands require input.pressSequentially
      await this.cursor.fill(`${cmd}; ES=$?; clear; echo EXITSTATUS-$ES`)
      await this.cursor.press('Enter')

      const box = await this.canvas.boundingBox() || { x: 72, y: 481 }
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
      return statusCode
    }
}
