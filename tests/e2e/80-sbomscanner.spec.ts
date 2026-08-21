import { test, expect } from './rancher/rancher-test'
import { RancherExtensionsPage } from './rancher/rancher-extensions.page'
import { RancherAppsPage } from './rancher/rancher-apps.page'
import { RancherUI } from './components/rancher-ui'
import { Registry, SbomScannerPage, authSecret } from './sbomscanner/sbomscanner.page'
import { ClusterAdmissionPoliciesPage, Policy } from './pages/policies.page'
import { Deployment, RancherWorkloadsPage } from './rancher/rancher-workloads.page'
import { PolicyReporterPage } from './pages/policyreporter.page'
import { conf } from '../env-config'

// Configure defaults after env is loaded
test.beforeAll(async({ request }) => {
  // Use local build (yarn serve), prime (if available) or github
  const fallback = RancherUI.isPrime ? 'github' : 'github'
  conf.ui_from ||= await request.head(conf.source.sbomscanner)
    .then(r => r.ok() ? 'source' as const : fallback)
    .catch(() => fallback)
})

test('Install UI extension', { tag: '@scan' }, async({ page, ui }) => {
  const extensions = new RancherExtensionsPage(page)
  await extensions.goto()

  if (conf.ui_from === 'prime') {
    await test.step('Add official repository', async() => {
      await extensions.addRancherRepos({ rancher: true, partners: false })
      await ui.retry(async() => {
        await extensions.selectTab('Available')
        await expect(extensions.getByName('SBOMScanner')).toBeVisible({ timeout: 30_000 })
      }, 'Not showing SBOMScanner extension')
    })
  }

  if (conf.ui_from === 'github') {
    await test.step('Add github repository', async() => {
      const apps = new RancherAppsPage(page)
      await page.getByTestId('extensions-page-menu').click()
      await page.getByText('Manage Repositories', { exact: true }).click()
      await apps.addRepository({ name: 'sbomscanner-extension-github', url: 'https://rancher.github.io/security-ui-exts/' })
    })
  }

  await test.step('Install or developer load extension', async() => {
    await extensions.goto()
    if (conf.ui_from === 'source') {
      await extensions.developerLoad(conf.source.sbomscanner)
    } else {
      await extensions.install('SBOMScanner', { version: process.env.UIVERSION?.replace(/^sbomscanner-ui-ext-/, '') })
    }
  })
})

test('Install SBOMScanner', { tag: '@scan' }, async({ page, nav, ui }) => {
  // Disable partners repo for cnpg chart - issue#716
  await nav.explorer('Apps', 'Repositories')
  const partners = ui.tableRow('Partners')
  await partners.action('Disable')
  await partners.toHaveState('Disabled')

  const sbomPage = new SbomScannerPage(page)
  await sbomPage.install()

  await nav.explorer('Apps', 'Repositories')
  await partners.action('Enable')
  await partners.toHaveState('Active')
})

test('Scan Admission Controller', { tag: '@scan' }, async({ page, ui, nav }) => {
  // Configure Workload Scan
  await nav.sbomScanner('Workloads Scan')
  const sbomPage = new SbomScannerPage(page)
  await sbomPage.setWorkloadScan({
    enabled   : true,
    skipTLS   : conf.kw_from === 'gitlab' || undefined,
    authSecret: conf.kw_from === 'prime' ? authSecret.name : undefined,
    nsFilter  : { 'kubernetes.io/metadata.name': 'cattle-kubewarden-system' },
    osFilter  : { linux: 'amd64' }
  })

  // Wait for Workload Scan
  await nav.sbomScanner('Registries Configuration')
  await ui.tableRow({ Repositories: /kubewarden-controller/ }).toHaveState('Completed', 2 * 60_000)

  // Check Images
  await nav.sbomScanner('Images')
  for (const image of ['controller', 'audit-scanner', 'policy-server']) {
    const row = ui.tableRow({ 'Image reference': new RegExp(`kubewarden-${image}`) })
    await expect(row.column('Affecting CVEs')).toHaveText('00000', { timeout: 5_000 }).catch(async(error) => {
      await row.open('Image reference')
      await ui.tableRow({ 'CVE ID': /.*/ }).waitFor()
      throw error
    })
  }
})

test.describe('Image CVE policy', () => {
  test('RBAC rules for Policy Server', async({ ui, nav }) => {
    await nav.cluster()
    await ui.importYaml(`
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sbomscanner-vulnerability-reports-viewer
rules:
  - apiGroups:
      - storage.sbomscanner.kubewarden.io
    resources:
      - vulnerabilityreports
    verbs:
      - get
      - list
      - watch
`)
    await ui.importYaml(`
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: sbomscanner-vulnerabilility-reports-viewer-policy-server
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: sbomscanner-vulnerability-reports-viewer
subjects:
  - kind: ServiceAccount
    name: policy-server
    namespace: cattle-kubewarden-system
`)
  })

  test('Create test policy', async({ page }) => {
    const cvePolicy : Policy = {
      title    : 'image-cve',
      name     : 'test-image-cve',
      mode     : 'Monitor',
      yamlPatch: {
        'spec.settings.vulnerabilityReportNamespace'    : 'cattle-sbomscanner-system',
        'spec.settings.maxSeverity.critical.total'      : 0,
        'spec.settings.maxSeverity.high.total'          : 5,
        'spec.settings.maxSeverity.medium.total'        : 10,
        'spec.settings.maxSeverity.low.total'           : 20,
        'spec.settings.ignoreMissingVulnerabilityReport': true,
        'spec.failurePolicy'                            : 'Ignore',
        'spec.timeoutEvalSeconds'                       : 10,
      }
    }
    const polPage = new ClusterAdmissionPoliciesPage(page)
    await polPage.create(cvePolicy, { wait: true })
  })

  test('Create WorkloadScan', async({ page }) => {
    const sbomPage = new SbomScannerPage(page)
    await sbomPage.setWorkloadScan({
      enabled : true,
      nsFilter: { 'kubernetes.io/metadata.name': 'cattle-kubewarden-system' },
    })
  })

  test('Create test deployment', async({ page, shell }) => {
    // ghcr.io/nginx/nginx-unprivileged:1.26.3-alpine-perl
    // ghcr.io/nginx/nginx-unprivileged:1.29.0-alpine-perl
    const dep: Deployment = {
      name     : 'test-workloadscan',
      namespace: 'workloadscan-ns',
      image    : 'ghcr.io/nginx/nginx-unprivileged:1.29.0-alpine-perl',
    }
    const wlPage = new RancherWorkloadsPage(page)
    await wlPage.addDeployment(dep)
    await shell.run(`k label namespace ${dep.namespace} sbomscanner.kubewarden.io/workloadscan=true`)
  })

  test('Check compliance report', async({ page, ui, nav }) => {
    await nav.sbomScanner('Registries Configuration')
    await ui.tableRow({ Repositories: 'nginx/nginx-unprivileged' }).toHaveState('Finished')

    const reporter = new PolicyReporterPage(page)
    await reporter.runJob()

    await nav.explorer('Workloads', 'Deployments')
    await ui.tableRow('test-workloadscan').open()
    await ui.tab('Compliance').click()
    const row = ui.tableRow({ Policy: 'test-image-cve' })
    await ui.retry(async() => {
      await row.toHaveState('fail', 5_000)
    }, 'Load new reports')
    await row.row.locator('td.row-expand').click()
    await expect(row.row.locator('..')).toContainText('Exceeded the number of allowed CVEs')
  })

  test('Teardown', async({ ui, shell }) => {
  // test.skip()
    const sbomPage = new SbomScannerPage(ui.page)
    await sbomPage.deleteVexHub('rancher-vexhub')
    await shell.runBatch(
      'k delete ns workloadscan-ns --ignore-not-found',
      'k delete ClusterRole sbomscanner-vulnerability-reports-viewer --ignore-not-found',
      'k delete ClusterRoleBinding sbomscanner-vulnerabilility-reports-viewer-policy-server --ignore-not-found',
      'k delete WorkloadScanConfiguration default --ignore-not-found',
      'k delete ClusterAdmissionPolicy test-image-cve --ignore-not-found',
      'k delete polr,cpolr,reps,creps -A --all'
    )
  })
})

test('Check Rancher VEX Hub', async({ nav, ui }) => {
  await nav.sbomScanner('VEX Management')
  await ui.tableRow('rancher').toHaveState('Enabled')
})

test('Trigger registry scan', async({ page }) => {
  const sbomPage = new SbomScannerPage(page)
  const registry: Registry = {
    name        : 'test-registry',
    uri         : 'ghcr.io',
    repositories: ['kubewarden/sbomscanner/test-assets/golang']
  }
  await sbomPage.addRegistry(registry)
  await sbomPage.triggerScan(registry.name)
  await sbomPage.deleteRegistry(registry.name)
})
