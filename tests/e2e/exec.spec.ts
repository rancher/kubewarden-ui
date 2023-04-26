import { test } from './rancher-test'
import { RancherCommonPage } from './pages/rancher-common.page';

const charts = [
  {name: 'Jaeger Operator', namespace: 'jaeger', chart: "jaeger-operator"},
  {name: 'Monitoring', project: '(None)', chart: "rancher-monitoring"},
  {name: 'Kubewarden', project: 'Default', chart: "rancher-kubewarden-controller"},
]

// Install chart from apps menu
// app=Monitoring pw test exec -g 'appInstall' --headed
test('appInstall', async({ page}) => {
  const app = charts.find(o => o.name === process.env.app) || charts[0]

  const rancher = new RancherCommonPage(page)
  await rancher.installApp(app.name, {namespace: app.namespace, project: app.project, validate: app.chart})
});

// Upgrade without any changes will reload app yaml (patched by kubectl)
// app='Jaeger Operator' pw test exec -g 'appUpdate' --headed
test('appUpdate', async({ page }) => {
    const app = charts.find(o => o.name === process.env.app) || charts[0]

    const rancher = new RancherCommonPage(page)
    await rancher.updateApp(app.name, {validate: app.chart})
});
