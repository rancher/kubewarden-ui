import { test } from './rancher-test'
import { type Chart, RancherAppsPage } from './pages/rancher-apps.page';

const charts: Chart[] = [
  {title: 'Jaeger Operator', namespace: 'jaeger', check: "jaeger-operator"},
  {title: 'Monitoring', project: '(None)', check: "rancher-monitoring"},
  {title: 'Kubewarden', project: 'Default', check: "rancher-kubewarden-controller"},
]

// Install chart from apps menu
// app=Monitoring pw test exec -g 'appInstall' --headed
test('appInstall', async({ page}) => {
  const chart = charts.find(o => o.title === process.env.app) || charts[0]

  const apps = new RancherAppsPage(page)
  await apps.installChart(chart)
});

// Upgrade without any changes will reload app yaml (patched by kubectl)
// app='Jaeger Operator' pw test exec -g 'appUpdate' --headed
test('appUpdate', async({ page }) => {
    const app = process.env.app || 'jaeger-operator'

    const apps = new RancherAppsPage(page)
    await apps.updateApp(app)
});
