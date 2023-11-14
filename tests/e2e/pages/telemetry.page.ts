import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from './basepage'

type ChecklistLine = 'otel' | 'jaeger' | 'monitoring' | 'configmap' | 'config'

export class TelemetryPage extends BasePage {
  readonly tracingTab: Locator
  readonly metricsTab: Locator
  readonly configBtn: Locator
  readonly monitoringBtn: Locator
  readonly configmapBtn: Locator
  readonly lines: Record<ChecklistLine, Locator>

  constructor(page: Page) {
    super(page)
    this.tracingTab = page.locator('section#policy-tracing:visible')
    this.metricsTab = page.locator('section#policy-metrics:visible')

    this.lines = {
      otel      : this.page.getByTestId(/^kw-(tracing|monitoring)-checklist-step-open-tel$/).filter({ has: this.page.locator(':visible') }),
      jaeger    : this.tracingTab.getByTestId('kw-tracing-checklist-step-jaeger'),
      monitoring: this.metricsTab.getByTestId('kw-monitoring-checklist-step-monitoring-app'),
      configmap : this.metricsTab.getByTestId('kw-monitoring-checklist-step-config-map'),
      config    : this.metricsTab.getByTestId('kw-monitoring-checklist-step-controller-config').or(
        this.tracingTab.getByTestId('kw-tracing-checklist-step-config')
      )
    }
    this.configBtn = this.lines.config.getByRole('button', { name: /^(Edit|Update) Config$/ })
    this.monitoringBtn = this.lines.monitoring.getByRole('button', { name: 'Install App' })
    this.configmapBtn = this.lines.configmap.getByRole('button', { name: 'Add Grafana Dashboards' })
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
