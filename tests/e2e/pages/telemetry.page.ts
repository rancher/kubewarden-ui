import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from '../rancher/basepage'
import { Chart, Repo, RancherAppsPage } from '../rancher/rancher-apps.page'
import { YAMLPatch } from '../components/rancher-ui'

type ChecklistLine = 'otel' | 'jaeger' | 'monitoring' | 'servicemonitor' | 'configmap' | 'config'

function getLine(tab: Page|Locator, text: string|RegExp) {
  return tab.locator('div.checklist__step:visible', { hasText: text })
}

type ManagedApp = Chart & {
  repo : Repo
  yaml?: YAMLPatch
}

type ManagedAppList = keyof typeof managedApps

export const managedApps = {
  certManager: {
    title    : 'cert-manager', name     : 'cert-manager', namespace: 'cert-manager', check    : 'cert-manager',
    repo     : { name: 'jetstack', url: 'https://charts.jetstack.io' },
    yaml     : (y) => { y.crds.enabled = true }
  },
  openTelemetry: {
    // https://github.com/open-telemetry/opentelemetry-helm-charts/blob/main/charts/opentelemetry-operator/UPGRADING.md
    title    : 'opentelemetry-operator', name     : 'opentelemetry-operator', namespace: 'open-telemetry', check    : 'opentelemetry-operator', version  : process.env.OTEL_OPERATOR,
    repo     : { name: 'open-telemetry', url: 'https://open-telemetry.github.io/opentelemetry-helm-charts' },
    yaml     : (y) => { y.manager.collectorImage.repository = 'ghcr.io/open-telemetry/opentelemetry-collector-releases/opentelemetry-collector-contrib' }
  },
  jaeger: {
    title    : 'jaeger-operator', name     : 'jaeger-operator', namespace: 'jaeger', check    : 'jaeger-operator',
    repo     : { name: 'jaegertracing', url: 'https://jaegertracing.github.io/helm-charts' },
    yaml     : { 'jaeger.create': true, 'rbac.clusterRole': true }
  },
} satisfies Record<string, ManagedApp>

export class TelemetryPage extends BasePage {
  readonly tracingTab: Locator
  readonly metricsTab: Locator
  readonly configBtn : Locator
  readonly lines     : Record<ChecklistLine, Locator>

  constructor(page: Page) {
    super(page)
    this.tracingTab = page.locator('section#policy-tracing:visible')
    this.metricsTab = page.locator('section#policy-metrics:visible')

    this.lines = {
      otel          : getLine(page, /^The OpenTelemetry Operator/),
      jaeger        : getLine(this.tracingTab, /^The Jaeger Operator/),
      monitoring    : getLine(this.metricsTab, /^The Rancher Monitoring app/),
      servicemonitor: getLine(this.metricsTab, /^(A|The) Service Monitor/),
      configmap     : getLine(this.metricsTab, /^Grafana Dashboards/),
      config        : getLine(page, /^(Tracing|The Kubewarden Controller) must be (enabled and )?configured/)
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

  async addManaged(name: ManagedAppList) {
    const app = managedApps[name]
    const appsPage = new RancherAppsPage(this.page)
    await appsPage.addRepository(app.repo)
    await appsPage.installChart(app, { yamlPatch: app.yaml })
  }

  async removeManaged(name: ManagedAppList) {
    const app = managedApps[name]
    const appsPage = new RancherAppsPage(this.page)
    await appsPage.deleteApp(app.name!)
    await appsPage.deleteRepository(app.repo)
  }
}
