import { test, expect } from './rancher/rancher-test'
import { RancherAppsPage } from './rancher/rancher-apps.page'
import { PolicyServersPage } from './pages/policyservers.page'
import { managedApps, TelemetryPage } from './pages/telemetry.page'
import { RancherUI } from './components/rancher-ui'
import { AdmissionPoliciesPage, Policy } from './pages/policies.page'

/**
 * Expect timeout has to be increased after telemetry installation on local cluster
 */
test.describe('Setup', () => {
  test('Install OpenTelemetry', async({ page, nav }) => {
    test.skip(process.env.MODE === 'fleet')

    const telPage = new TelemetryPage(page)

    // Otel is not installed
    for (const tab of ['Tracing', 'Metrics'] as const) {
      await nav.pservers('default', tab)
      await telPage.toBeIncomplete('otel')
      await expect(telPage.configBtn).toBeDisabled()
    }

    // Install Cert-Manager on imported clusters
    if (nav.testCluster.name !== 'local') {
      await telPage.addManaged('certManager')
    }

    // Install OpenTelemetry & Check
    await telPage.addManaged('openTelemetry')
    for (const tab of ['Tracing', 'Metrics'] as const) {
      await nav.pservers('default', tab)
      await telPage.toBeComplete('otel')
    }
  })

  test('Create custom PolicyServer & Policy', async({ page }) => {
    const policy: Policy = { name: 'no-privileged-custom', title: 'Pod Privileged Policy', mode: 'Monitor', server: 'custom-ps' }
    await new PolicyServersPage(page).create({ name: 'custom-ps' })
    await new AdmissionPoliciesPage(page).create(policy, { wait: process.env.MODE == 'fleet' })
  })
})

test.describe('Tracing', () => {
  let appsPage: RancherAppsPage
  let telPage: TelemetryPage

  test.beforeEach(async({ nav, page }) => {
    appsPage = new RancherAppsPage(page)
    telPage = new TelemetryPage(page)
    await nav.pservers('default', 'Tracing')
  })

  test('Install Jaeger', async({ nav, ui }) => {
    test.skip(process.env.MODE === 'fleet')

    // Jaeger is not installed
    await telPage.toBeIncomplete('jaeger')
    await expect(telPage.configBtn).toBeDisabled()
    // Install Jaeger
    if (RancherUI.hasAppCollection) {
      await appsPage.installFromAppCollection(managedApps.jaeger)
    } else {
      await telPage.addManaged('jaeger')
    }

    // Jaeger is installed
    await nav.pservers('default', 'Tracing')
    await ui.retry(async() => {
      await telPage.toBeComplete('jaeger')
    }, 'Jaeger does not show checkmark')
  })

  test('Configure tracing', async({ ui, shell }) => {
    test.skip(process.env.MODE === 'fleet')

    await telPage.toBeIncomplete('config')
    await telPage.configBtn.click()
    const now = new Date().toISOString()
    await appsPage.updateApp('rancher-kubewarden-controller', {
      navigate : false,
      questions: async() => {
        await ui.tab(/^(Open)?Telemetry/).click()
        await ui.checkbox('Enable Tracing').check()
        await ui.input('Jaeger endpoint configuration').fill('jaeger-operator-jaeger-collector.jaeger.svc.cluster.local:4317')
        await ui.checkbox('Jaeger endpoint insecure TLS configuration').check()
      }
    })
    // Wait until kubewarden controller restarts policyserver
    await shell.retry(`kubectl logs -l app=kubewarden-policy-server-default -n cattle-kubewarden-system -c otc-container --since-time ${now} | grep -F "Everything is ready."`)
  })

  test('Check traces are visible', async({ ui, nav, shell }) => {
    const logline = ui.tableRow('tracing-privpod').row.first()

    // Create trace log line
    await nav.cluster()
    await shell.privpod({ name: 'tracing-privpod' })

    await test.step('Check default PS', async() => {
      // Check logs on policy server
      await nav.pservers('default', 'Tracing')
      await expect(logline).toBeVisible()
      // Check logs on (recommended) policy
      await nav.capolicies('no-privileged-pod', 'Tracing')
      await expect(logline).toBeVisible()
    })

    await test.step('Check custom PS', async() => {
      // Check logs on the custom policy server
      await nav.pservers('custom-ps', 'Tracing')
      await expect(logline).toBeVisible()
      // Check logs on the (custom) policy
      await nav.apolicies('no-privileged-custom', 'Tracing')
      await expect(logline).toBeVisible()
    })
  })

  test('Uninstall tracing', async({ ui, nav, shell }) => {
    test.skip(process.env.MODE === 'fleet')

    // Clean up
    await appsPage.updateApp('rancher-kubewarden-controller', {
      questions: async() => {
        await ui.tab(/^(Open)?Telemetry/).click()
        await ui.checkbox('Enable Tracing').uncheck()
      }
    })
    if (RancherUI.hasAppCollection) {
      await appsPage.deleteApp('jaeger-operator')
    } else {
      await telPage.removeManaged('jaeger')
    }
    await shell.run('kubectl delete ns jaeger')

    // Check
    await nav.pservers('default', 'Tracing')
    await telPage.toBeIncomplete('config')
    await telPage.toBeIncomplete('jaeger')
    await expect(telPage.configBtn).toBeDisabled()
  })
})

test.describe('Metrics', () => {
  test.skip(process.env.MODE === 'fleet')

  let appsPage: RancherAppsPage
  let telPage: TelemetryPage

  test.beforeEach(async({ nav, page }) => {
    appsPage = new RancherAppsPage(page)
    telPage = new TelemetryPage(page)
    await nav.pservers('default', 'Metrics')
  })

  test('Install Monitoring', async({ ui, nav }) => {
    // Monitoring is not installed
    await telPage.toBeIncomplete('monitoring')
    await expect(telPage.configBtn).toBeDisabled()
    // Install Monitoring
    await ui.button('Install App').click()
    await appsPage.installChart(
      { title: 'Monitoring', check: 'rancher-monitoring' },
      { navigate: false, timeout: 7 * 60_000 }
    )
    // Monitoring is installed
    await nav.pservers('default', 'Metrics')
    await ui.retry(async() => {
      await telPage.toBeComplete('monitoring')
    }, 'The Grafana proxy URL can not be found or is configured incorrectly')
  })

  test('Configure metrics', async({ ui, shell }) => {
    await test.step('Configure default PolicyServer', async() => {
      // Create Prometheus ServiceMonitor
      await telPage.toBeIncomplete('servicemonitor')
      await expect(telPage.configBtn).toBeDisabled()
      await ui.button('Add Service Monitor').click()
      await telPage.toBeComplete('servicemonitor')
      // Create Grafana ConfigMaps
      await telPage.toBeIncomplete('configmap')
      await expect(telPage.configBtn).toBeDisabled()
      await ui.button('Add Grafana Dashboards').click()
      await telPage.toBeComplete('configmap')
    })

    await test.step('Enable metrics in controller', async() => {
      await telPage.toBeIncomplete('config')
      await telPage.configBtn.click()
      await appsPage.updateApp('rancher-kubewarden-controller', {
        navigate : false,
        questions: async() => {
          await ui.tab(/^(Open)?Telemetry/).click()
          await ui.checkbox('Enable Metrics').check()
        }
      })
      // Wait until kubewarden controller restarts policyserver
      const now = new Date().toISOString()
      await shell.retry(`kubectl logs -l app=kubewarden-policy-server-default -n cattle-kubewarden-system -c otc-container --since-time ${now} | grep -F "Everything is ready."`)
    })
  })

  test('Check metrics are visible', async({ ui, page, nav }) => {
    const metrics = [
      /Request accepted with no mutation percentage/,
      /Request rejection percentage/,
      /Request mutation percentage/,
      /Total accepted requests with no mutation/,
      /Total mutated requests/,
      /Total rejected requests/,
      /Request count/,
    ]

    const checkMetrics = async() => {
      const frame = page.frameLocator('iframe')

      for (const metric of metrics) {
        // byTestId for Rancher >2.9, byLabel for old versions
        const panel = frame.getByTestId(metric).or(frame.getByLabel(metric))
        // Accepted metrics should be >0, rejected could be 0
        const number = metric.source.includes('accepted') ? /^[1-9][0-9.]*%?$/ : /^[0-9.]+%?$/
        await expect(panel.getByText(number)).toBeVisible({ timeout: 7 * 60_000 })
      }
    }

    await test.step('Check default PS metrics', async() => {
      await nav.pservers('default', 'Metrics')
      await checkMetrics()
    })

    await test.step('Check custom PS metrics', async() => {
      await nav.pservers('custom-ps', 'Metrics')
      await ui.button('Add Service Monitor').click()
      await checkMetrics()
    })
  })

  test('Uninstall metrics', async({ ui, nav, shell }) => {
    // Disable metrics
    await appsPage.updateApp('rancher-kubewarden-controller', {
      questions: async() => {
        await ui.tab(/^(Open)?Telemetry/).click()
        await ui.checkbox('Enable Metrics').uncheck()
      }
    })
    // Uninstall monitoring
    await appsPage.deleteApp('rancher-monitoring')
    await appsPage.deleteApp('rancher-monitoring-crd')
    await shell.run('kubectl delete cm -n cattle-dashboards kubewarden-dashboard-policy kubewarden-dashboard-policyserver')
    // Check
    await nav.pservers('default', 'Metrics')
    await ui.retry(async() => {
      await telPage.toBeIncomplete('config')
      await telPage.toBeIncomplete('monitoring')
      await telPage.toBeIncomplete('servicemonitor')
      await telPage.toBeIncomplete('configmap')
    }, 'Service monitor shows as installed')
    await expect(telPage.configBtn).toBeDisabled()
  })
})

test.describe('Teardown', () => {
  test('Delete custom PolicyServer', async({ page }) => {
    await new PolicyServersPage(page).delete('custom-ps')
  })

  test('Uninstall OpenTelemetry', async({ page, nav }) => {
    test.skip(process.env.MODE === 'fleet')

    const telPage = new TelemetryPage(page)
    await telPage.removeManaged('openTelemetry')
    if (nav.testCluster.name !== 'local') {
      await telPage.removeManaged('certManager')
    }
  })
})
