import { test, expect } from './rancher-test'
import { RancherCommonPage } from './pages/rancher-common.page'
import { RancherExtensionsPage } from './pages/rancher-extensions.page'
import { KubewardenPage } from './pages/kubewarden.page'
import { PolicyServersPage } from './pages/policyservers.page'
import { apList, capList } from './pages/policies.page'
import { RancherAppsPage } from './pages/rancher-apps.page'

// source (yarn dev) | rc (add github repo) | released (just install)
const ORIGIN = process.env.ORIGIN || (process.env.API ? 'source' : 'rc')

test('00 Initial rancher setup', async({ page, ui }) => {
  const rancher = new RancherCommonPage(page)

  await page.goto('/')

  // We handle only first-login, then reuse session for access
  if (!await rancher.isLoggedIn()) {
    await rancher.handleFirstLogin('sa')
  }
  // wait for local cluster to be Active
  await ui.getRow('local').toBeActive()
  // disable namespace filter
  await rancher.setNamespaceFilter('All Namespaces')
  // enable extension developer features
  await rancher.setExtensionDeveloperFeatures(true)
})

test('01 Enable extension support', async({ page, ui }) => {
  const extensions = new RancherExtensionsPage(page)

  await extensions.enable(ORIGIN === 'released')

  // Wait for default list of extensions
  if (ORIGIN === 'released') {
    await ui.withReload(async() => {
      await extensions.selectTab('All')
      await expect(page.locator('.plugin', { hasText: 'Kubewarden' })).toBeVisible()
    }, 'Not showing kubewarden extension')
  }
})

test('02 Install extension', async({ page }) => {
  // Add UI charts repository
  if (ORIGIN === 'rc') {
    const apps = new RancherAppsPage(page)
    await apps.addRepository('kubewarden-extension-rc', 'https://rancher.github.io/kubewarden-ui/')
  }

  // Install or developer load extension
  const extensions = new RancherExtensionsPage(page)
  await extensions.goto()
  if (ORIGIN === 'source') {
    await extensions.developerLoad('http://127.0.0.1:4500/kubewarden-0.0.1/kubewarden-0.0.1.umd.min.js')
  } else {
    await extensions.install('kubewarden')
  }
})

test('03 Install kubewarden', async({ page, ui, nav }) => {
  const kwPage = new KubewardenPage(page)
  await kwPage.installKubewarden()

  // Check UI is active
  await nav.explorer('Kubewarden')
  await ui.withReload(async() => {
    await expect(page.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()
  }, 'Kubewarden installation not detected')
})

test('04 Install default policyserver', async({ page, ui }) => {
  const psPage = new PolicyServersPage(page)
  const kwPage = new KubewardenPage(page)

  // Banner is visible on Overview page
  await kwPage.goto()
  await expect(psPage.noDefaultPsBanner).toBeVisible()
  // Banner is visible on Policy Servers page
  await psPage.goto()
  await expect(psPage.noDefaultPsBanner).toBeVisible()

  await ui.button('Install Chart').click()
  await expect(page).toHaveURL(/.*\/apps\/charts\/install.*chart=kubewarden-defaults/)

  // Handle PolicyServer Installer Dialog
  await psPage.installDefault({ recommended: true, mode: 'monitor' })
})

test('05 Whitelist Artifact Hub', async({ page, ui, nav }) => {
  const policyCards = page.getByTestId(/^kw-grid-subtype-card/)

  await nav.explorer('Kubewarden', 'ClusterAdmissionPolicies')
  await ui.button('Create').click()

  // Check counts before ArtifactHub
  await expect(page.getByRole('heading', { name: 'Custom Policy' })).toBeVisible()
  await expect(policyCards).toHaveCount(1)

  // Whitelist ArtifactHub
  await expect(page.getByText('Official Kubewarden policies are hosted on ArtifactHub')).toBeVisible()
  await ui.button('Add ArtifactHub To Whitelist').click()

  // Check counts after ArtifactHub
  await expect(page.getByRole('heading', { name: 'Pod Privileged Policy' })).toBeVisible()
  await expect(policyCards).toHaveCount(capList.length)

  await nav.explorer('Kubewarden', 'AdmissionPolicies')
  await ui.button('Create').click()
  await expect(policyCards).toHaveCount(apList.length)
})
