import { test, expect } from '@playwright/test';

const charts = [
  {id: "jaeger", name: 'Jaeger Operator', namespace: 'jaeger', chart: "jaeger-operator"},
  {id: "monitoring", name: 'Monitoring', project: '(None)', chart: "rancher-monitoring"},
  {id: "kubewarden", name: 'Kubewarden', project: 'Default', chart: "rancher-kubewarden-controller"},
  {id: "kubewarden-defaults", chart: "rancher-kubewarden-defaults"},
]


// app=kubewarden pw test helpers -g 'appInstall' --headed
// app=jaeger npx playwright test helpers -g 'appInstall' --headed
test('appInstall', async({ page }) => {
  const app = charts.find(o => o.id === process.env.app) || charts[0]

  // Select chart to be installed
  await page.goto('/dashboard/c/local/apps/charts')
  await expect(page.getByRole('heading', { name: 'Charts', exact: true })).toBeVisible()
  await page.getByRole('main').getByRole('heading', { name: app.name, exact: true }).click()
  await page.getByRole('button', { name: 'Install' }).click()

  // select namespace or project
  if (app.namespace !== undefined){
      await expect(page.getByText('Namespace *')).toBeVisible()
      await page.getByRole('combobox', { name: 'Search for option' }).click()
      await page.getByText('Create a New Namespace').click();
      await page.getByPlaceholder('Create a New Namespace').fill(app.namespace);
  }
  if (app.project !== undefined) {
    await expect(page.getByText('Install into Project')).toBeVisible()
    await page.getByRole('combobox', { name: 'Search for option' }).click()
    await page.getByRole('option', { name: app.project }).click()
  }

  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Install' }).click()

  // Fixme SUCCESS: helm install
  const re = new RegExp(`SUCCESS: helm .* ${app.chart} \/home`)
  await expect(page.locator('#windowmanager').getByText(re)).toBeVisible({timeout:300_000})
});

// Upgrade without any changes will reload app yaml (patched by kubectl)
// app=jaeger npx playwright test helpers -g 'appReload' --headed
test('appReload', async({ page }) => {
    const app = charts.find(o => o.id === process.env.app);

    await page.goto('/dashboard/c/local/apps/catalog.cattle.io.app')
    await expect(page.getByRole('heading', { name: 'Installed Apps' })).toBeVisible()

    await page.locator(`button[id$='+${app?.chart}']`).click()  // id="actionButton+0+rancher-kubewarden-controller"
    await page.getByText('Edit/Upgrade').click()

    await expect(page.getByRole('heading', { name: app?.chart })).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Update' }).click()

    const re = new RegExp(`SUCCESS: helm upgrade .* ${app?.chart} \/home`)
    await expect(page.locator('#windowmanager').getByText(re)).toBeVisible({timeout:300_000})
});
