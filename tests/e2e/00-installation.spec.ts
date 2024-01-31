import { test, expect } from './rancher/rancher-test'
import { RancherCommonPage } from './rancher/rancher-common.page'
import { RancherExtensionsPage } from './rancher/rancher-extensions.page'
import { KubewardenPage } from './pages/kubewarden.page'
import { PolicyServersPage } from './pages/policyservers.page'
import { apList, capList } from './pages/policies.page'
import { RancherAppsPage } from './rancher/rancher-apps.page'
import { RancherFleetPage } from './rancher/rancher-fleet.page'

// source (yarn dev) | rc (add github repo) | released (just install)
const ORIGIN = process.env.ORIGIN || (process.env.API ? 'source' : 'rc')
const FLEET = !!process.env.FLEET

test('00 Initial rancher setup', async({ page, ui, nav }) => {
  const rancher = new RancherCommonPage(page)

  await test.step('Global setup', async() => {
    await page.goto('/')
    // Handle first-login, then reuse session for access
    if (!await rancher.isLoggedIn()) {
      await rancher.handleFirstLogin('sa')
    }
    // Wait for local cluster to be Active
    await ui.tableRow('local').toBeActive()
    // Enable extension developer features
    await rancher.setExtensionDeveloperFeatures(true)
  })

  await test.step('Cluster setup', async() => {
    await nav.cluster()
    // Disable namespace filter
    await rancher.setNamespaceFilter('All Namespaces')
  })
})

test('01 Install UI extension', async({ page, ui }) => {
  const extensions = new RancherExtensionsPage(page)

  await test.step('Enable extension support', async() => {
    await extensions.enable(ORIGIN === 'released')
    // Wait for default list of extensions
    if (ORIGIN === 'released') {
      await ui.withReload(async() => {
        await extensions.selectTab('All')
        await expect(page.locator('.plugin', { hasText: 'Kubewarden' })).toBeVisible()
      }, 'Not showing kubewarden extension')
    }
  })

  if (ORIGIN === 'rc') {
    await test.step('Add UI charts repository', async() => {
      const apps = new RancherAppsPage(page)
      await page.getByTestId('extensions-page-menu').click()
      await page.getByText('Manage Repositories', { exact: true }).click()
      await apps.addRepository('kubewarden-extension-rc', 'https://rancher.github.io/kubewarden-ui/')
    })
  }

  await test.step('Install or developer load extension', async() => {
    await extensions.goto()
    if (ORIGIN === 'source') {
      await extensions.developerLoad('http://127.0.0.1:4500/kubewarden-0.0.1/kubewarden-0.0.1.umd.min.js')
    } else {
      await extensions.install('kubewarden')
    }
  })
})

test('03a Install Kubewarden', async({ page, ui, nav, context }) => {
  test.skip(FLEET)

  // Required by cert-manager copy on click
  // Setting clipboard-write on model is broken, probably playwright issue
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const kwPage = new KubewardenPage(page)
  await kwPage.installKubewarden()
  await context.clearPermissions()

  // Check UI is active
  await nav.explorer('Kubewarden')
  await ui.withReload(async() => {
    await expect(page.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()
  }, 'Kubewarden installation not detected')

  await test.step('Install default policyserver', async() => {
    const psPage = new PolicyServersPage(page)

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
})

test('03b Install Kubewarden by Fleet', async({ page, ui }) => {
  test.skip(!FLEET)

  const fleetPage = new RancherFleetPage(page)
  const repoRow = await fleetPage.addRepository({
    name       : 'therepo',
    url        : 'https://github.com/kravciak/kubewarden-ui.git',
    branch     : 'fleet',
    selfHealing: true,
    paths      : ['tests/e2e/fleet/'],
    workspace  : 'fleet-local',
    yamlPatch  : (y) => { y.spec.correctDrift.force = true }
  })

  await ui.withReload(async() => {
    await expect(repoRow.column('Clusters Ready')).toHaveText('1/1', { timeout: 7 * 60_000 })
  }, 'Installed but not refreshed?')
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
