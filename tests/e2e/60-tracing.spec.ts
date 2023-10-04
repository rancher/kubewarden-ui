import { test, expect } from './rancher-test';
import { Chart, RancherAppsPage } from './pages/rancher-apps.page';
import { PolicyServersPage } from './pages/policyservers.page';

/**
 * Expect timeout has to be increased after telemetry installation on local cluster
 *
 */
test('Install opentelemetry & jaeger', async ({ page }) => {
  const apps = new RancherAppsPage(page)
  const otelChart: Chart = { title: 'opentelemetry-operator', name: 'opentelemetry-operator', namespace: 'open-telemetry', version: '0.38.0', check: 'opentelemetry-operator' }
  const jaegerChart: Chart = { title: 'Jaeger Operator', namespace: 'jaeger', check: "jaeger-operator" }

  // Install OpenTelemetry
  await apps.addRepository('open-telemetry', 'https://open-telemetry.github.io/opentelemetry-helm-charts')
  await apps.installChart(otelChart)

  // Install Jaeger
  await apps.installChart(jaegerChart, d => {
    d.jaeger.create = "true"
    d.rbac.clusterRole = "true"
  })
});

test('Enable tracing in Kubewarden', async ({ page, ui }) => {
  const apps = new RancherAppsPage(page)
  await apps.updateApp('rancher-kubewarden-controller', d => {
    d.telemetry.enabled = true
    d.telemetry.tracing.jaeger.endpoint = "jaeger-operator-jaeger-collector.jaeger.svc.cluster.local:14250"
    d.telemetry.tracing.jaeger.tls = {}
    d.telemetry.tracing.jaeger.tls.insecure = true
  })

  // Wait until kubewarden controller and policyserver are restarted, it takes around 1m
  await ui.shell(`for i in $(seq 60); do
      echo "Retry #$i";
      k logs -l app=kubewarden-policy-server-default -n cattle-kubewarden-system -c otc-container | grep -F 'Everything is ready.' && break || sleep 5;
    done`)
});

test('Check traces are visible', async ({ page, ui }) => {
  const tracingTab = page.getByRole('tablist').locator('li#policy-tracing')
  const policiesTab = page.getByRole('tablist').locator('li#related-policies')
  const logline = ui.getRow('tracing-privpod').row.first()

  const psPage = new PolicyServersPage(page)
  await psPage.goto()

  // Create trace log line
  await ui.shell('k run tracing-privpod --image=nginx:alpine --privileged')
  console.warn('Workaround: Opentelemetry not installed warning before I generate traces')
  await page.reload()

  // Check logs on policy server
  await ui.getRow('default').open()
  await tracingTab.click()
  await expect(logline).toBeVisible()

  // Check logs on the policy
  await policiesTab.click()
  await ui.getRow('no-privileged-pod').open()
  await tracingTab.click()
  await expect(logline).toBeVisible()

  // Cleanup
  await ui.shell('k delete pod tracing-privpod')
})
