import { test, expect } from './rancher/rancher-test'
import { RancherCommonPage } from './rancher/rancher-common.page'
import { RancherExtensionsPage } from './rancher/rancher-extensions.page'
import { AppVersion, KubewardenPage } from './pages/kubewarden.page'
import { PolicyServersPage } from './pages/policyservers.page'
import { apList, capList, ClusterAdmissionPoliciesPage } from './pages/policies.page'
import { RancherAppsPage } from './rancher/rancher-apps.page'
import { RancherFleetPage } from './rancher/rancher-fleet.page'

// source (yarn dev) | rc (add github repo) | released (just install)
const ORIGIN = process.env.ORIGIN || (process.env.API ? 'source' : 'rc')
expect(ORIGIN).toMatch(/^(source|rc|released)$/)

const MODE = process.env.MODE || 'base'
expect(MODE).toMatch(/^(base|fleet|upgrade)$/)

// Known Kubewarden versions for upgrade test, start at [0]
// Skip defaults version checks - it's not auto updated
const upMap: AppVersion[] = [
  { app: 'v1.8.0', controller: '2.0.0', crds: '1.4.2', defaults: '1.8.0' },
  { app: 'v1.9.0', controller: '2.0.5', crds: '1.4.4' }, // defaults: '1.9.2'
  { app: 'v1.10.0', controller: '2.0.8', crds: '1.4.5' }, // defaults: '1.9.3'
  { app: 'v1.11.0', controller: '2.0.10', crds: '1.4.6' }, // defaults: '1.9.4'
]

test('Initial rancher setup', async({ page, ui, nav }) => {
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
    // Enable RC Helm Charts
    await rancher.setHelmCharts('Include Prerelease Versions')
  })

  await test.step('Cluster setup', async() => {
    await nav.cluster()
    // Disable namespace filter
    await rancher.setNamespaceFilter('All Namespaces')
  })
})

test('Install UI extension', async({ page, ui }) => {
  const extensions = new RancherExtensionsPage(page)

  await test.step('Enable extension support', async() => {
    await extensions.enable({ rancherRepo: ORIGIN === 'released' })
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

test('Install Kubewarden', async({ page, ui, nav, context }) => {
  test.skip(MODE === 'fleet')

  // Required by cert-manager copy on click
  // Setting clipboard-write on model is broken, probably playwright issue
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const kwPage = new KubewardenPage(page)
  await kwPage.installKubewarden({ version: MODE === 'upgrade' ? upMap[0].controller : undefined })
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
    await psPage.installDefault({ version: MODE === 'upgrade' ? upMap[0].defaults : undefined, recommended: true, mode: 'monitor' })
  })
})

test('Install Kubewarden by Fleet', async({ page, ui }) => {
  test.skip(MODE !== 'fleet')
  test.setTimeout(15 * 60_000)

  const fleetPage = new RancherFleetPage(page)
  const repoRow = await fleetPage.addRepository({
    name       : 'therepo',
    url        : 'https://github.com/rancher/kubewarden-ui.git',
    branch     : 'main',
    selfHealing: true,
    paths      : ['tests/e2e/fleet/'],
    workspace  : 'fleet-local'
  })

  await ui.withReload(async() => {
    await fleetPage.selectWorkspace('fleet-local')
    await expect(repoRow.column('Clusters Ready')).toHaveText('1/1', { timeout: 7 * 60_000 })
  }, 'Installed but not refreshed?')
})

test('Whitelist Artifact Hub', async({ page, ui, nav }) => {
  const cap = new ClusterAdmissionPoliciesPage(page)

  await test.step('Whitelist ArtifactHub', async() => {
    await nav.capolicy()
    await ui.button('Create').click()
    await expect(cap.cards({ name: 'Custom Policy' })).toBeVisible()
    await expect(cap.cards()).toHaveCount(1)
    await cap.whitelist()
  })

  await test.step('Check Official policies', async() => {
    // CAP
    await nav.capolicy()
    await ui.button('Create').click()
    await expect(cap.cards()).toHaveCount(capList.length)
    await expect(cap.cards({ signed: true, official: true })).toHaveCount(capList.length - 1) // -1 for Custom Policy
    // AP
    await nav.apolicy()
    await ui.button('Create').click()
    await expect(cap.cards()).toHaveCount(apList.length)
    await expect(cap.cards({ signed: true, official: true })).toHaveCount(apList.length - 1) // -1 for Custom Policy

    // Only Custom Policy is unofficial & unsigned
    await expect(cap.cards({ signed: false })).toHaveCount(1)
    await expect(cap.cards({ official: false })).toHaveCount(1)
    await expect(cap.cards({ name: 'Custom Policy', signed: false, official: false })).toBeVisible()
    // We have context-aware and mutating policy
    await expect(cap.cards({ aware: true }).first()).toBeVisible()
    await expect(cap.cards({ mutation: true }).first()).toBeVisible()
  })

  await test.step('Check User policies', async() => {
    await nav.capolicy()
    await ui.button('Create').click()
    // Display User policies
    await ui.button('Deselect Kubewarden Developers').click()
    await expect(cap.cards().nth(capList.length)).toBeVisible()
    // Check User policies
    const extraCount = await cap.cards().count() - capList.length
    expect(extraCount, 'Extra policies should be visible').toBeGreaterThanOrEqual(1)
    await expect(cap.cards({ official: false }), 'Extra policies should be unofficial').toHaveCount(extraCount + 1)
    await expect(cap.cards({ official: true }), 'Official count should not change').toHaveCount(capList.length - 1)
  })
})

test('Upgrade Kubewarden', async({ page, nav }) => {
  test.skip(MODE !== 'upgrade')

  const kwPage = new KubewardenPage(page)
  const apps = new RancherAppsPage(page)

  // Keep track of last upgraded version
  let last: AppVersion = upMap[upMap.length - 1]

  await test.step('Upgrade predefined versions', async() => {
    for (let i = 0; i < upMap.length - 1; i++) {
      await nav.kubewarden()
      await kwPage.upgrade({ from: upMap[i], to: upMap[i + 1] })
    }
  })

  await test.step('Upgrade unknown versions', async() => {
    let next: AppVersion|null
    while ((next = await kwPage.getUpgrade()) !== null) {
      await kwPage.upgrade({ from: last, to: next })
      last = next
    }
    // Check there are no more upgrades
    await expect(kwPage.currentVer).toContainText(`App Version: ${last.app}`)
    await expect(kwPage.upgradeVer).not.toBeVisible()
  })

  await test.step('Upgrade Policy Server', async() => {
    // Update to last known version or latest one
    await apps.updateApp('rancher-kubewarden-defaults', { version: last.defaults || 0 })
    // Check resources are online and with right versions
    await nav.explorer('Apps', 'Installed Apps')
    await apps.checkChart('rancher-kubewarden-defaults', last.defaults)
  })
})

test('Check kubewarden resources', async({ page, nav, shell }) => {
  await test.step('Check kubewarden apps', async() => {
    const apps = new RancherAppsPage(page)
    await nav.explorer('Apps', 'Installed Apps')
    for (const chart of ['controller', 'crds', 'defaults']) {
      await apps.checkChart(`rancher-kubewarden-${chart}`)
    }
    await shell.waitPods()
  })

  await test.step('Check kubewarden logs', async() => {
    await nav.cluster()

    // Kubewarden pod labels
    const labels = [
      'app=kubewarden-policy-server-default',
      'app.kubernetes.io/name=kubewarden-controller',
      'app.kubernetes.io/name=policy-reporter',
      'app.kubernetes.io/name=ui']

    // Ignore known errors
    const ignore = [
      'Reconciler.*object has been modified',
      'policy_server:.*(TufError|Sigstore)', // Fix in https://github.com/kubewarden/kwctl/issues/753
    ].join('|')

    // Check for ERROR text in logs
    await shell.runBatch(...labels.map(
      label => `k logs -n cattle-kubewarden-system -l '${label}' --tail -1
     | grep ERROR | grep -vE '${ignore}'
     | tee /dev/stderr | wc -l | grep -x 0`))
  })
})
