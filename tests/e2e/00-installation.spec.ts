import { test, expect } from './rancher/rancher-test'
import { RancherCommonPage } from './rancher/rancher-common.page'
import { RancherExtensionsPage } from './rancher/rancher-extensions.page'
import { AppVersion, KubewardenPage } from './pages/kubewarden.page'
import { PolicyServersPage } from './pages/policyservers.page'
import { ClusterAdmissionPoliciesPage } from './pages/policies.page'
import { RancherAppsPage } from './rancher/rancher-apps.page'
import { RancherFleetPage } from './rancher/rancher-fleet.page'
import { RancherUI } from './components/rancher-ui'
import { Common } from './components/common'

const conf = {
  // Install UI extension from: source (yarn dev), github (github tag), prime (official)
  ui_from: process.env.ORIGIN as 'source'|'github'|'prime'|undefined,
  // How to install Kubewarden: manual (from UI extension), fleet, upgrade (previously version)
  kw_mode: process.env.MODE as 'manual'|'fleet'|'upgrade'|undefined,
  // Fetch Kubewarden versions from github for upgrade test
  upMap  : [] as AppVersion[]
}

if (conf.ui_from) expect(conf.ui_from).toMatch(/^(source|github|prime)$/)
if (conf.kw_mode) expect(conf.kw_mode).toMatch(/^(manual|fleet|upgrade)$/)

// Configure defaults after env is loaded
test.beforeAll(async() => {
  conf.ui_from ??= RancherUI.isPrime ? 'prime' : 'github'
  conf.kw_mode ??= 'manual'

  if (conf.kw_mode === 'upgrade') {
    conf.upMap = (await Common.fetchVersionMap()).splice(-3)
  }
})

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
    await nav.userNav('Preferences')
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
  await extensions.goto()

  await test.step('Enable extension support', async() => {
    if (RancherUI.isVersion('<2.9')) {
      await extensions.enable({ rancher: conf.ui_from === 'prime', partners: false })
    }
    // Wait for default list of extensions
    if (conf.ui_from === 'prime') {
      if (RancherUI.isVersion('>=2.9')) {
        await extensions.addRancherRepos({ rancher: true, partners: false })
      }
      await ui.retry(async() => {
        await extensions.selectTab('All')
        await expect(page.locator('.plugin', { hasText: 'Kubewarden' })).toBeVisible({ timeout: 30_000 })
      }, 'Not showing kubewarden extension')
    }
  })

  if (conf.ui_from === 'github') {
    await test.step('Add UI charts repository', async() => {
      const apps = new RancherAppsPage(page)
      await page.getByTestId('extensions-page-menu').click()
      await page.getByText('Manage Repositories', { exact: true }).click()
      await apps.addRepository({ name: 'kubewarden-extension-github', url: 'https://rancher.github.io/kubewarden-ui/' })
    })
  }

  await test.step('Install or developer load extension', async() => {
    await extensions.goto()
    if (conf.ui_from === 'source') {
      await extensions.developerLoad('http://127.0.0.1:4500/kubewarden-0.0.1/kubewarden-0.0.1.umd.min.js')
    } else {
      await extensions.install('kubewarden', { version: process.env.UIVERSION?.replace(/^kubewarden-/, '') })
    }
  })
})

test('Install Kubewarden', async({ page, ui, nav }) => {
  test.skip(conf.kw_mode === 'fleet')

  const kwPage = new KubewardenPage(page)
  await kwPage.installKubewarden({ version: conf.kw_mode === 'upgrade' ? conf.upMap[0].controller : undefined })

  // Check UI is active
  await nav.kubewarden()
  await ui.retry(async() => {
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

test('Install Kubewarden by Fleet', async({ page }) => {
  test.skip(conf.kw_mode !== 'fleet')
  test.slow()

  const fleetPage = new RancherFleetPage(page)
  await fleetPage.addGitRepo({
    name       : 'kubewarden',
    url        : 'https://github.com/rancher/kubewarden-ui.git',
    branch     : 'main',
    selfHealing: true,
    paths      : ['tests/e2e/fleet/'],
  }, { timeout: 2 * 60_000 })
})

test('Add Policy Catalog Repository', async({ page, ui, nav }) => {
  const cap = new ClusterAdmissionPoliciesPage(page)
  await nav.capolicies()

  // Check without the repository
  await ui.button('Create').click()
  await expect(ui.button('Create Custom Policy')).toBeVisible()
  await expect(cap.cards()).toHaveCount(0)
  await expect(page.getByText('No official policies found.')).toBeVisible()

  // Add the repository
  await ui.button('Add Policy Catalog Repository').click()
  await expect(page.getByText('No official policies found.')).not.toBeVisible()
  await ui.retry(async() => {
    await expect(cap.cards()).toHaveCount(100)
  }, 'No policy repository found. Please add a policy repository to view policies.')
})

test('Upgrade Kubewarden', async({ page, nav }) => {
  test.skip(conf.kw_mode !== 'upgrade')
  test.slow()

  const kwPage = new KubewardenPage(page)
  const apps = new RancherAppsPage(page)

  // Check we installed old versions
  await nav.explorer('Apps', 'Installed Apps')
  for (const chart of ['controller', 'crds', 'defaults']) {
    await apps.checkChart(`rancher-kubewarden-${chart}`, conf.upMap[0][chart])
  }

  // Keep track of last upgraded version
  let last: AppVersion = conf.upMap[conf.upMap.length - 1]

  await test.step('Upgrade predefined versions', async() => {
    for (let i = 0; i < conf.upMap.length - 1; i++) {
      await nav.kubewarden()
      await kwPage.upgrade({ from: conf.upMap[i], to: conf.upMap[i + 1] })
    }
  })

  await test.step('Upgrade unknown versions', async() => {
    let next: AppVersion|null
    while ((next = await kwPage.getUpgrade()) !== null) {
      await kwPage.upgrade({ from: last, to: next })
      last = next
    }
    // Check there are no more upgrades
    await expect(kwPage.currentApp).toContainText(`App Version: ${last.app}`)
    await expect(kwPage.upgradeApp).not.toBeVisible()
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
      // 'policy_server:.*(TufError|Sigstore)', // Fix in https://github.com/kubewarden/kwctl/issues/753
    ].join('|')

    // Check for ERROR text in logs
    await shell.runBatch(...labels.map(
      label => `k logs -n cattle-kubewarden-system -l '${label}' --tail -1
     | grep ERROR | grep -vE '${ignore}'
     | tee /dev/stderr | wc -l | grep -x 0`))
  })
})
