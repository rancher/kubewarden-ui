import { test, expect } from './rancher-test';
import { Chart, RancherAppsPage } from './pages/rancher-apps.page';

const otelChart: Chart = { title: 'opentelemetry-operator', name: 'opentelemetry-operator', namespace: 'open-telemetry', check: 'opentelemetry-operator' }
const jaegerChart: Chart = { title: 'Jaeger Operator', namespace: 'jaeger', check: "jaeger-operator" }

/**
 * Expect timeout has to be increased after telemetry installation on local cluster
 *
 */
test('Set up tracing', async ({ page, ui, nav }) => {
  const apps = new RancherAppsPage(page)

  const tracing = page.locator('section#policy-tracing')
  const otel = tracing.getByTestId('kw-tracing-checklist-step-open-tel')
  const jaeger = tracing.getByTestId('kw-tracing-checklist-step-jaeger')
  const enableBtn = tracing.getByTestId('kw-tracing-checklist-step-config-button')

  await test.step('Install OpenTelemetry', async () => {
    // Otel is disabled
    await nav.pserver('default', 'Tracing')
    await expect(otel.locator('i.icon-dot-open')).toBeVisible()
    await expect(enableBtn).toHaveAttribute('disabled', 'disabled')
    // Install OpenTelemetry
    await apps.addRepository('open-telemetry', 'https://open-telemetry.github.io/opentelemetry-helm-charts')
    await apps.installChart(otelChart)
    // Otel is enabled
    await nav.pserver('default', 'Tracing')
    await expect(otel.locator('i.icon-checkmark')).toBeVisible()
  })

  await test.step('Install Jaeger', async () => {
    // Jaeger is disabled
    await nav.pserver('default', 'Tracing')
    await expect(jaeger.locator('i.icon-dot-open')).toBeVisible()
    await expect(enableBtn).toHaveAttribute('disabled', 'disabled')
    // Install Jaeger
    await apps.installChart(jaegerChart, {yamlPatch: d => {
      d.jaeger.create = "true"
      d.rbac.clusterRole = "true"
    }})
    // Jaeger is enabled
    await nav.pserver('default', 'Tracing')
    await expect(jaeger.locator('i.icon-checkmark')).toBeVisible()
  })

  await test.step('Enable tracing in Kubewarden', async () => {
    const apps = new RancherAppsPage(page)
    // Tracing is disabled
    await nav.pserver('default', 'Tracing')
    await enableBtn.click()

    // Enable tracing
    await apps.nextBtn.click()
    await page.getByRole('tab', {name: 'Telemetry', exact: true}).click()
    await ui.checkbox('Enable Tracing').check()
    await ui.input('Jaeger endpoint configuration').fill('jaeger-operator-jaeger-collector.jaeger.svc.cluster.local:4317')
    await ui.checkbox('Jaeger endpoint insecure TLS configuration').check()
    await apps.updateBtn.click()
    await apps.waitHelmSuccess('rancher-kubewarden-controller')

    // Wait until kubewarden controller and policyserver are restarted, it takes around 1m
    await ui.shell(`for i in $(seq 60); do echo "Retry #$i"; k logs -l app=kubewarden-policy-server-default -n cattle-kubewarden-system -c otc-container | grep -F 'Everything is ready.' && break || sleep 5; done`)
  })
});

test('Check traces are visible', async ({ page, ui, nav }) => {
  const tracingTab = page.getByRole('tablist').locator('li#policy-tracing')
  const policiesTab = page.getByRole('tablist').locator('li#related-policies')
  const logline = ui.getRow('tracing-privpod').row.first()

  // Create trace log line
  await nav.cluster('local')
  await ui.shell(
    'k run tracing-privpod --image=nginx:alpine --privileged',
    'k delete pod tracing-privpod'
  )

  // Check logs on policy server
  await nav.pserver('default', 'Tracing')
  await expect(logline).toBeVisible()

  // Check logs on the policy
  await policiesTab.click()
  await ui.getRow('no-privileged-pod').open()
  await tracingTab.click()
  await expect(logline).toBeVisible()
})
