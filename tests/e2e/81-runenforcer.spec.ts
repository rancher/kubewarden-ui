import { test, expect } from './rancher/rancher-test'
import { RancherExtensionsPage } from './rancher/rancher-extensions.page'
import { RancherAppsPage } from './rancher/rancher-apps.page'
import { RancherUI } from './components/rancher-ui'
import { conf } from '../env-config'
import { RuntimeEnforcerPage } from './suse-security/runtime-enforcer.page'

// Configure defaults after env is loaded
test.beforeAll(async({ request }) => {
  // Use local build (yarn serve), prime (if available) or github
  const fallback = RancherUI.isPrime ? 'github' : 'github'
  conf.ui_from ||= await request.head(conf.source.runenforcer)
    .then(r => r.ok() ? 'source' as const : fallback)
    .catch(() => fallback)
})

test('Install UI extension', { tag: '@re' }, async({ page, ui }) => {
  const extensions = new RancherExtensionsPage(page)
  await extensions.goto()

  if (conf.ui_from === 'prime') {
    await test.step('Add official repository', async() => {
      await extensions.addRancherRepos({ rancher: true, partners: false })
      await ui.retry(async() => {
        await extensions.selectTab('Available')
        await expect(extensions.getByName('SUSE Security Runtime Enforcer')).toBeVisible({ timeout: 30_000 })
      }, 'Not showing Runtime Enforcer extension')
    })
  }

  if (conf.ui_from === 'github') {
    await test.step('Add github repository', async() => {
      const apps = new RancherAppsPage(page)
      await page.getByTestId('extensions-page-menu').click()
      await page.getByText('Manage Repositories', { exact: true }).click()
      await apps.addRepository({ name: 'runenforcer-extension-github', url: 'https://rancher.github.io/security-ui-exts/' })
    })
  }

  await test.step('Install or developer load extension', async() => {
    await extensions.goto()
    if (conf.ui_from === 'source') {
      await extensions.developerLoad(conf.source.runenforcer)
    } else {
      await extensions.install('SUSE Security Runtime Enforcer', { version: process.env.UIVERSION?.replace(/^runtime-enforcer-/, '') })
    }
  })
})

test('Install Runtime Enforcer', { tag: '@re' }, async({ page }) => {
  const rePage = new RuntimeEnforcerPage(page)
  await rePage.installFrom(conf.kw_from)
})
