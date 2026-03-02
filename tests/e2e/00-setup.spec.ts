import { test } from './rancher/rancher-test'
import { RancherCommonPage } from './rancher/rancher-common.page'

test('Initial rancher setup', { tag: ['@kw', '@sbom'] }, async({ page, ui, nav }) => {
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
