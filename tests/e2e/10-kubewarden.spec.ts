import { test, expect } from './rancher/rancher-test'
import { RancherExtensionsPage } from './rancher/rancher-extensions.page'
import { AppVersion, KubewardenPage } from './pages/kubewarden.page'
import { ClusterAdmissionPoliciesPage } from './pages/policies.page'
import { RancherAppsPage } from './rancher/rancher-apps.page'
import { RancherFleetPage } from './rancher/rancher-fleet.page'
import { RancherUI, YAMLPatch } from './components/rancher-ui'
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
    upMap = (await Common.fetchVersionMap('Admission Controller')).splice(-2)
      // Limit because of https://github.com/kubewarden/policy-server/issues/1300
      .filter(v => semver.gte(v.app.replace(/^v/, ''), '1.37.0'))
    if (upMap.length === 0) {
      throw new Error('No compatible version was found, check rancher-version annotations')
    }
    console.log(upMap)
  }
})

test('Install UI extension', { tag: '@ac' }, async({ page, ui }) => {
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

test('Install Admission Controller', { tag: '@ac' }, async({ page, ui, nav }) => {
  test.skip(conf.kw_mode === 'fleet')

  const acPage = new KubewardenPage(page)
  if (conf.kw_mode === 'upgrade') {
    // Install released version & upgrade to MR
    await acPage.installFrom('appco', { version: upMap[0].controller })
  } else {
    await acPage.installFrom(conf.kw_from)
  }

  // Check UI is active
  await nav.kubewarden()
  await ui.retry(async() => {
    await expect(page.getByRole('heading', { name: /^Welcome to (Kubewarden|Admission Policy Management)/ })).toBeVisible()
  }, 'Kubewarden installation not detected')
})

test('Install Kubewarden by Fleet', { tag: '@ac' }, async({ page }) => {
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

test('Add Policy Catalog Repository', { tag: '@ac' }, async({ page, ui, nav }) => {
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

test('Upgrade Kubewarden', async({ page, nav, ui }) => {
  test.skip(conf.kw_mode !== 'upgrade')
  test.slow()

  const acPage = new KubewardenPage(page)
  const apps = new RancherAppsPage(page)

  // Check that old version is installed
  await nav.explorer('Apps', 'Installed Apps')
  await apps.checkChart(`rancher-admission-controller`, upMap[0].controller)

  let acPatch: YAMLPatch | undefined
  if (conf.kw_from === 'gitlab') {
    const gl = Common.findGitLabRefs('Admission Controller')

    // Replace official repository with GitLab
    await nav.explorer('Apps', 'Repositories')
    await ui.tableRow('admission-controller-charts').action('Edit Config')
    await ui.input('OCI Repository Host URL *').fill(gl.chart)
    await ui.checkbox('Skip TLS Verifications').check()
    await ui.button('Save').click()

    acPatch = (y) => {
      for (const node of [y.image, y.policyServer.image, y.auditScanner.image]) {
        node.registry = gl.reg
        node.tag = node.tag.replace(/-.*/, '')
      }
    }
  }

  // Keep track of last upgraded version
  let last: AppVersion = upMap[upMap.length - 1]

  await test.step('Upgrade predefined versions', async() => {
    for (let i = 0; i < upMap.length - 1; i++) {
      await nav.kubewarden()
      await acPage.upgrade({ from: upMap[i], to: upMap[i + 1], patch: acPatch })
    }
  })

  await test.step('Upgrade unknown versions', async() => {
    let next: AppVersion|null
    while ((next = await acPage.getUpgrade()) !== null) {
      await acPage.upgrade({ from: last, to: next, patch: acPatch })
      last = next
    }
    // Check there are no more upgrades
    await expect(acPage.currentApp).toContainText(`App Version: ${last.app}`)
    await expect(acPage.upgradeApp).not.toBeVisible()
  })
})
