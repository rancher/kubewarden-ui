import { test, expect } from './rancher-test'
import { RancherCommonPage } from './pages/rancher-common.page';
import { RancherExtensionsPage } from './pages/rancher-extensions.page';
import { KubewardenPage } from './pages/kubewarden.page';
import { PolicyServersPage } from './pages/policyservers.page';

// source (yarn dev) | rc (add github repo) | released (just install)
const ORIGIN = process.env.ORIGIN || (process.env.API ? 'source' : 'rc')


test('00 Initial rancher setup', async({ page, ui }) => {
  const rancher = new RancherCommonPage(page)
  await page.goto('/');

  // We handle only first-login, then reuse session for access
  if (! await rancher.isLoggedIn()) {
    await rancher.handleFirstLogin('sa')
  }
  // wait for local cluster to be Active
  await expect(ui.getRow('local').column('State')).toHaveText('Active', {timeout: 60_000})
  // disable namespace filter
  await rancher.setNamespaceFilter('All Namespaces')
  // enable extension developer features
  await rancher.setExtensionDeveloperFeatures(true)
});

test('01 Enable extension support', async({ page }) => {
  const extensions = new RancherExtensionsPage(page)
  await extensions.enable(ORIGIN == 'released')

  // Wait for default list of extensions
  if (ORIGIN == 'released') {
    await extensions.selectTab('All')
    try {
      // Extension list is usually empty without page refresh
      await expect(page.locator('.plugin', {hasText: 'Kubewarden'} )).toBeVisible();
    } catch (e) {
      console.log('Reload: Not showing kubewarden extension')
      await page.reload();
      await extensions.selectTab('All')
      await expect(page.locator('.plugin', {hasText: 'Kubewarden'} )).toBeVisible();
    }
  }
});

test('02 Install extension', async({ page }) => {
  // Add UI charts repository
  if (ORIGIN == 'rc') {
    const rancher = new RancherCommonPage(page)
    await rancher.addRepository('kubewarden-extension-rc', 'https://kubewarden.github.io/ui')
  }

  // Install or developer load extension
  const extensions = new RancherExtensionsPage(page)
  await extensions.goto()
  if (ORIGIN == 'source') {
    await extensions.developerLoad('http://127.0.0.1:4500/kubewarden-0.0.1/kubewarden-0.0.1.umd.min.js')
  } else {
    await extensions.install('kubewarden')
  }
});

test('03 Install kubewarden', async({ page }) => {
  const kwPage = new KubewardenPage(page)
  await kwPage.installKubewarden()

  // Check UI is active
  await page.getByRole('navigation').getByRole('link', { name: 'Kubewarden' }).click()
  try {
    await expect(page.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()
  } catch (e) {
    console.log('Reload: Kubewarden installation done but not detected')
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()
  }

});

test('04 Install default policyserver', async({ page, ui }) => {
  const psPage = new PolicyServersPage(page)

  // Check banner is also visible on overview page
  const kwPage = new KubewardenPage(page)
  await kwPage.goto()
  await expect(psPage.noDefaultPsBanner).toBeVisible()

  await psPage.goto()
  await expect(psPage.noDefaultPsBanner).toBeVisible()
  await page.getByRole('button', {name: 'Install Chart', exact: true}).click()
  await expect(page).toHaveURL(/.*\/apps\/charts\/install.*chart=kubewarden-defaults/)

  // Handle PolicyServer Installer Dialog
  await expect(page.getByRole('heading', { name: 'Install: Step 1' })).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()

  await expect(page.getByRole('heading', { name: 'Install: Step 2' })).toBeVisible()
  await psPage.installDefaultDialog({enable: true, mode: 'monitor'})

  await page.getByRole('button', { name: 'Install' }).click();
  await expect(ui.helmPassRegex('rancher-kubewarden-defaults')).toBeVisible({timeout:40_000})
});

test('05 Whitelist artifacthub', async({ page }) => {
  const kwPage = new KubewardenPage(page)

  await page.goto('/dashboard/c/local/kubewarden/policies.kubewarden.io.clusteradmissionpolicy/create')
  await expect(page.getByRole('heading', { name: 'Custom Policy' })).toBeVisible()
  await expect(page.locator('.subtype')).toHaveCount(1);

  await kwPage.whitelistArtifacthub()
  await expect(page.getByRole('heading', { name: 'Pod Privileged Policy' })).toBeVisible()
  await expect(page.locator(".subtype")).toHaveCount(30) // we have 29 + 1 custom
});
