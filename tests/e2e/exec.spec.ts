import { test } from './rancher-test'
import { type Chart, RancherCommonPage } from './pages/rancher-common.page';

const charts: Chart[] = [
  {title: 'Jaeger Operator', namespace: 'jaeger', name: "jaeger-operator"},
  {title: 'Monitoring', project: '(None)', name: "rancher-monitoring"},
  {title: 'Kubewarden', project: 'Default', name: "rancher-kubewarden-controller"},
]

// Install chart from apps menu
// app=Monitoring pw test exec -g 'appInstall' --headed
test('appInstall', async({ page}) => {
  const chart = charts.find(o => o.title === process.env.app) || charts[0]

  const rancher = new RancherCommonPage(page)
  await rancher.installApp(chart)
});

// Upgrade without any changes will reload app yaml (patched by kubectl)
// app='Jaeger Operator' pw test exec -g 'appUpdate' --headed
test('appUpdate', async({ page }) => {
    const chart = charts.find(o => o.title === process.env.app) || charts[0]

    const rancher = new RancherCommonPage(page)
    await rancher.updateApp(chart)
});
