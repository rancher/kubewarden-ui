import { test, expect } from './rancher/rancher-test'
import { RancherExtensionsPage } from './rancher/rancher-extensions.page'
import { AppVersion, KubewardenPage } from './pages/kubewarden.page'
import { ClusterAdmissionPoliciesPage } from './pages/policies.page'
import { RancherAppsPage } from './rancher/rancher-apps.page'
import { RancherFleetPage } from './rancher/rancher-fleet.page'
import { RancherUI } from './components/rancher-ui'
import { Common } from './components/common'
import { conf } from '../env-config'
import semver from 'semver'

// Fetch Kubewarden versions from github for upgrade test
let upMap = [] as AppVersion[]

// Configure defaults after env is loaded
test.beforeAll(async({ request }) => {
  // Use local build (yarn serve), prime (if available) or github
  const fallback = RancherUI.isPrime ? 'prime' : 'github'
  conf.ui_from ||= await request.head(conf.source.kubewarden)
    .then(r => r.ok() ? 'source' as const : fallback)
    .catch(() => fallback)

  if (conf.kw_mode === 'upgrade') {
    upMap = (await Common.fetchVersionMap()).splice(-3)
      // Limit because of https://github.com/kubewarden/policy-server/issues/1300
      .filter(v => semver.gte(v.app.replace(/^v/, ''), '1.29.0'))

    if (upMap.length === 0) {
      throw new Error('No compatible version was found, check rancher-version annotations')
    }
  }
})

test('Install UI extension', { tag: '@kw' }, async({ page, ui }) => {
  const extensions = new RancherExtensionsPage(page)
  await extensions.goto()

  if (conf.ui_from === 'prime') {
    await test.step('Add official repository', async() => {
      await extensions.addRancherRepos({ rancher: true, partners: false })
      await ui.retry(async() => {
        await extensions.selectTab('Available')
        await expect(extensions.getByName('SUSE Security Admission Controller')).toBeVisible({ timeout: 30_000 })
      }, 'Not showing kubewarden extension')
    })
  }

  if (conf.ui_from === 'github') {
    await test.step('Add github repository', async() => {
      const apps = new RancherAppsPage(page)
      await page.getByTestId('extensions-page-menu').click()
      await page.getByText('Manage Repositories', { exact: true }).click()
      await apps.addRepository({ name: 'kubewarden-extension-github', url: 'https://rancher.github.io/kubewarden-ui/' })
    })
  }

  await test.step('Install or developer load extension', async() => {
    await extensions.goto()
    if (conf.ui_from === 'source') {
      await extensions.developerLoad(conf.source.kubewarden)
    } else {
      await extensions.install(/kubewarden|SUSE Security Admission Controller/, { version: process.env.UIVERSION?.replace(/^kubewarden-/, '') })
    }
  })
})

test('Install Kubewarden', { tag: '@kw' }, async({ page, ui, nav }) => {
  test.skip(conf.kw_mode === 'fleet')

  const kwPage = new KubewardenPage(page)
  if (conf.kw_from == 'github') {
    await kwPage.installGithub({ version: conf.kw_mode === 'upgrade' ? upMap[0].controller : undefined })
  } else if (conf.kw_from == 'gitlab') {
    await kwPage.installGitlab()
  } else {
    await kwPage.installAppco()
  }

  // Check UI is active
  await nav.kubewarden()
  await ui.retry(async() => {
    await expect(page.getByRole('heading', { name: /^Welcome to (Kubewarden|Admission Policy Management)/ })).toBeVisible()
  }, 'Kubewarden installation not detected')
})

test('Install Kubewarden by Fleet', { tag: '@kw' }, async({ page }) => {
  test.skip(conf.kw_mode !== 'fleet')
  test.slow()

  const fleetPage = new RancherFleetPage(page)
  await fleetPage.addGitRepo({
    name       : 'kubewarden',
    url        : 'https://github.com/rancher/kubewarden-ui.git',
    branch     : 'main',
    selfHealing: true,
    paths      : ['tests/e2e/fleet/'],
  }, { timeout: 4 * 60_000 })
})

test('Add Policy Catalog Repository', { tag: '@kw' }, async({ page, ui, nav }) => {
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
  for (const chart of ['controller', 'crds', 'defaults'] as const) {
    await apps.checkChart(`rancher-kubewarden-${chart}`, upMap[0][chart])
  }

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
    await expect(kwPage.currentApp).toContainText(`App Version: ${last.app}`)
    await expect(kwPage.upgradeApp).not.toBeVisible()
  })
})
