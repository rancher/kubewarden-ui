import { test, expect } from './rancher/rancher-test'
import { Chart, ChartRepo, RancherAppsPage } from './rancher/rancher-apps.page'
import { TelemetryPage } from './pages/telemetry.page'
import { RancherUI } from './components/rancher-ui'

// OpenTelemetry
const otelRepo: ChartRepo = { name: 'open-telemetry', url: 'https://open-telemetry.github.io/opentelemetry-helm-charts' }
const otelChart: Chart = { title: 'opentelemetry-operator', name: 'opentelemetry-operator', namespace: 'open-telemetry', check: 'opentelemetry-operator' }
// Jaeger Tracing
const jaegerRepo: ChartRepo = { name: 'jaegertracing', url: 'https://jaegertracing.github.io/helm-charts' }
const jaegerChart: Chart = { title: 'jaeger-operator', name: 'jaeger-operator', namespace: 'jaeger', check: 'jaeger-operator' }
// Monitoring
const monitoringChart: Chart = { title: 'Monitoring', check: 'rancher-monitoring' }

/**
 * Expect timeout has to be increased after telemetry installation on local cluster
 */
test('Install OpenTelemetry', async({ page, nav }) => {
  test.skip(process.env.MODE === 'fleet')

  const apps = new RancherAppsPage(page)
  const telPage = new TelemetryPage(page)

  // Otel is not installed
  for (const tab of ['Tracing', 'Metrics'] as const) {
    await nav.pserver('default', tab)
    await telPage.toBeIncomplete('otel')
    await expect(telPage.configBtn).toBeDisabled()
  }
  // Install OpenTelemetry
  await apps.addRepository(otelRepo)
  await apps.installChart(otelChart,
    { yamlPatch: (y) => { y.manager.collectorImage.repository = 'otel/opentelemetry-collector-contrib' } })

  // Otel is installed
  for (const tab of ['Tracing', 'Metrics'] as const) {
    await nav.pserver('default', tab)
    await telPage.toBeComplete('otel')
  }
})

test.describe('Tracing', () => {
  let apps: RancherAppsPage
  let telPage: TelemetryPage

  test.beforeEach(async({ nav, page }) => {
    apps = new RancherAppsPage(page)
    telPage = new TelemetryPage(page)
    await nav.pserver('default', 'Tracing')
  })

  test('Install Jaeger', async({ nav }) => {
    test.skip(process.env.MODE === 'fleet')

    // Jaeger is not installed
    await telPage.toBeIncomplete('jaeger')
    await expect(telPage.configBtn).toBeDisabled()
    // Install Jaeger
    if (RancherUI.hasAppCollection) {
      await apps.installFromAppCollection(jaegerChart)
    } else {
      await apps.addRepository(jaegerRepo)
      await apps.installChart(jaegerChart, {
        yamlPatch: {
          'jaeger.create'   : true,
          'rbac.clusterRole': true,
        }
      })
    }

    // Jaeger is installed
    await nav.pserver('default', 'Tracing')
    await telPage.toBeComplete('jaeger')
  })

  test('Enable tracing', async({ ui, shell }) => {
    test.skip(process.env.MODE === 'fleet')

    await telPage.toBeIncomplete('config')
    await telPage.configBtn.click()
    await apps.updateApp('rancher-kubewarden-controller', {
      navigate : false,
      questions: async() => {
        await ui.tab('Telemetry').click()
        await ui.checkbox('Enable Tracing').check()
        await ui.input('Jaeger endpoint configuration').fill('jaeger-operator-jaeger-collector.jaeger.svc.cluster.local:4317')
        await ui.checkbox('Jaeger endpoint insecure TLS configuration').check()
      }
    })
    // Wait until kubewarden controller restarts policyserver
    const now = new Date().toISOString()
    await shell.retry(`kubectl logs -l app=kubewarden-policy-server-default -n cattle-kubewarden-system -c otc-container --since-time ${now} | grep -F "Everything is ready."`)
  })

  test('Check traces are visible', async({ ui, nav, shell }) => {
    const logline = ui.tableRow('tracing-privpod').row.first()

    // Create trace log line
    await nav.cluster()
    await shell.privpod({ name: 'tracing-privpod' })
    // Check logs on policy server
    await nav.pserver('default', 'Tracing')
    await expect(logline).toBeVisible()
    // Check logs on the (recommended) policy
    await nav.capolicy('no-privileged-pod', 'Tracing')
    await expect(logline).toBeVisible()
  })

  test('Uninstall tracing', async({ ui, nav, shell }) => {
    test.skip(process.env.MODE === 'fleet')

    // Clean up
    await apps.updateApp('rancher-kubewarden-controller', {
      questions: async() => {
        await ui.tab('Telemetry').click()
        await ui.checkbox('Enable Tracing').uncheck()
      }
    })
    await apps.deleteApp('jaeger-operator')
    await shell.run('kubectl delete ns jaeger')
    if (!RancherUI.hasAppCollection) {
      await apps.deleteRepository(jaegerRepo)
    }

    // Check
    await nav.pserver('default', 'Tracing')
    await telPage.toBeIncomplete('config')
    await telPage.toBeIncomplete('jaeger')
    await expect(telPage.configBtn).toBeDisabled()
  })
})

test.describe('Metrics', () => {
  test.skip(process.env.MODE === 'fleet')

  let apps: RancherAppsPage
  let telPage: TelemetryPage

  test.beforeEach(async({ nav, page }) => {
    apps = new RancherAppsPage(page)
    telPage = new TelemetryPage(page)
    await nav.pserver('default', 'Metrics')
  })

  test('Install Monitoring', async({ ui, nav }) => {
    // Monitoring is not installed
    await telPage.toBeIncomplete('monitoring')
    await expect(telPage.configBtn).toBeDisabled()
    // Install Monitoring
    await ui.button('Install App').click()
    await apps.installChart(monitoringChart, {
      navigate: false,
      timeout : 7 * 60_000
    })
    // Monitoring is installed
    await nav.pserver('default', 'Metrics')
    await telPage.toBeComplete('monitoring')
  })

  test('Create Prometheus ServiceMonitor', async({ ui }) => {
    // ServiceMonitor does not exist
    await telPage.toBeIncomplete('servicemonitor')
    await expect(telPage.configBtn).toBeDisabled()
    // Create service monitor
    await ui.button('Add Service Monitor').click()
    await telPage.toBeComplete('servicemonitor')
  })

  test('Create Grafana ConfigMaps', async({ ui }) => {
    // ConfigMap does not exist
    await telPage.toBeIncomplete('configmap')
    await expect(telPage.configBtn).toBeDisabled()
    // Create configmaps
    await ui.button('Add Grafana Dashboards').click()
    await telPage.toBeComplete('configmap')
  })

  test('Enable metrics', async({ ui, shell }) => {
    await telPage.toBeIncomplete('config')
    await telPage.configBtn.click()
    await apps.updateApp('rancher-kubewarden-controller', {
      navigate : false,
      questions: async() => {
        await ui.tab('Telemetry').click()
        await ui.checkbox('Enable Metrics').check()
      }
    })
    // Wait until kubewarden controller restarts policyserver
    const now = new Date().toISOString()
    await shell.retry(`kubectl logs -l app=kubewarden-policy-server-default -n cattle-kubewarden-system -c otc-container --since-time ${now} | grep -F "Everything is ready."`)
  })

  test('Check metrics are visible', async({ page, nav }) => {
    await nav.pserver('default', 'Metrics')
    const frame = page.frameLocator('iframe')
    for (const metric of [
      /Request accepted with no mutation percentage/,
      /Request rejection percentage/,
      /Request mutation percentage/,
      /Total accepted requests with no mutation/,
      /Total mutated requests/,
      /Total rejected requests/,
      /Request count/,
    ]) {
      // Skip some panels until bugfix is backported to Rancher <2.9 (1.6.4 release)
      if (RancherUI.isVersion('<2.9') && metric.source.match(/Total accepted|rejected/)) continue

      // byTestId for Rancher >2.9, byLabel for old versions
      const panel = frame.getByTestId(metric).or(frame.getByLabel(metric))
      // Accepted metrics should be >0, rejected could be 0
      const number = metric.source.includes('accepted') ? /^[1-9][0-9.]*%?$/ : /^[0-9.]+%?$/
      await expect(panel.getByText(number)).toBeVisible({ timeout: 7 * 60_000 })
    }
  })

  test('Uninstall metrics', async({ ui, nav, shell }) => {
    // Disable metrics
    await apps.updateApp('rancher-kubewarden-controller', {
      questions: async() => {
        await ui.tab('Telemetry').click()
        await ui.checkbox('Enable Metrics').uncheck()
      }
    })
    // Workaround for https://github.com/rancher/rancher/issues/45167
    await shell.run('kubectl patch clusterrole -n cattle-monitoring-system rancher-monitoring-crd-manager --type json -p \'[{"op": "add", "path": "/rules/0/verbs/-", "value":"list"}]\'')

    await apps.deleteApp('rancher-monitoring')
    await apps.deleteApp('rancher-monitoring-crd')
    await shell.run('kubectl delete cm -n cattle-dashboards kubewarden-dashboard-policy kubewarden-dashboard-policyserver')
    // Check
    await nav.pserver('default', 'Metrics')
    await telPage.toBeIncomplete('config')
    await telPage.toBeIncomplete('monitoring')
    await telPage.toBeIncomplete('servicemonitor')
    await telPage.toBeIncomplete('configmap')
    await expect(telPage.configBtn).toBeDisabled()
  })
})

test('Uninstall OpenTelemetry', async({ page }) => {
  test.skip(process.env.MODE === 'fleet')

  const apps = new RancherAppsPage(page)
  await apps.deleteApp('opentelemetry-operator')
  await apps.deleteRepository(otelRepo)
})
