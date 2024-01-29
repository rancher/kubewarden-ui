import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from '../rancher/basepage'

type ChecklistLine = 'otel' | 'jaeger' | 'monitoring' | 'servicemonitor' | 'configmap' | 'config'

function getLine(tab: Page|Locator, text: string|RegExp) {
  return tab.locator('div.checklist__step:visible', { hasText: text })
}

export class TelemetryPage extends BasePage {
  readonly tracingTab: Locator
  readonly metricsTab: Locator
  readonly configBtn: Locator
  readonly lines: Record<ChecklistLine, Locator>

  constructor(page: Page) {
    super(page)
    this.tracingTab = page.locator('section#policy-tracing:visible')
    this.metricsTab = page.locator('section#policy-metrics:visible')

    this.lines = {
      otel          : getLine(page, /^The OpenTelemetry Operator/),
      jaeger        : getLine(this.tracingTab, /^The Jaeger Operator/),
      monitoring    : getLine(this.metricsTab, /^The Rancher Monitoring app/),
      servicemonitor: getLine(this.metricsTab, /^A Service Monitor/),
      configmap     : getLine(this.metricsTab, /^Grafana Dashboards/),
      config        : getLine(page, /^(Tracing must be configured|The Kubewarden Controller)/)
    }
    this.configBtn = this.lines.config.getByRole('button', { name: /^(Edit|Update) Config$/ })
  }

  goto(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async isComplete(line: ChecklistLine): Promise<boolean> {
    await expect(this.lines[line].locator('i.icon-checkmark,i.icon-dot-open')).toBeVisible()
    return await this.lines[line].locator('i.icon-checkmark').isVisible()
  }

  async toBeComplete(line: ChecklistLine) {
    await expect(this.lines[line].locator('i.icon-checkmark')).toBeVisible()
  }

  async toBeIncomplete(line: ChecklistLine) {
    await expect(this.lines[line].locator('i.icon-dot-open')).toBeVisible()
  }
}
