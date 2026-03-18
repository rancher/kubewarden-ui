import { test, expect } from './rancher/rancher-test'
import { RancherExtensionsPage } from './rancher/rancher-extensions.page'
import { AppVersion } from './pages/kubewarden.page'
import { RancherAppsPage } from './rancher/rancher-apps.page'
import { RancherUI } from './components/rancher-ui'
import { Common } from './components/common'
import semver from 'semver'
import { Registry, SbomScannerPage, VexHub } from './pages/sbomscanner.page'
import { ClusterAdmissionPoliciesPage, Policy } from './pages/policies.page'
import { Deployment, RancherWorkloadsPage } from './rancher/rancher-workloads.page'
import { PolicyReporterPage } from './pages/policyreporter.page'

const conf = {
  src_url: 'http://127.0.0.1:4500/sbomscanner-ui-ext-0.0.1/sbomscanner-ui-ext-0.0.1.umd.min.js',
  // Install UI extension from: source (yarn dev), github (github tag), prime (official)
  ui_from: (process.env.ORIGIN || undefined) as 'source'|'github'|'prime'|undefined,
  // How to install Kubewarden: manual (from UI extension), fleet, upgrade (previous version)
  kw_mode: (process.env.MODE || undefined) as 'manual'|'fleet'|'upgrade'|undefined,
  // Fetch Kubewarden versions from github for upgrade test
  upMap  : [] as AppVersion[]
}

if (conf.ui_from) expect(conf.ui_from).toMatch(/^(source|github|prime)$/)
if (conf.kw_mode) expect(conf.kw_mode).toMatch(/^(manual|fleet|upgrade)$/)

// Configure defaults after env is loaded
test.beforeAll(async({ request }) => {
  // Use local build (yarn serve), prime (if available) or github
  const fallback = RancherUI.isPrime ? 'github' : 'github'
  conf.ui_from ||= await request.head(conf.src_url)
    .then(r => r.ok() ? 'source' as const : fallback)
    .catch(() => fallback)

  // Default to manual mode, unless fleet or upgrade is requested
  conf.kw_mode ||= 'manual'

  if (conf.kw_mode === 'upgrade') {
    conf.upMap = (await Common.fetchVersionMap()).splice(-3)
      // Limit because of https://github.com/kubewarden/policy-server/issues/1300
      .filter(v => semver.gte(v.app.replace(/^v/, ''), '1.29.0'))

    if (conf.upMap.length === 0) {
      throw new Error('No compatible version was found, check rancher-version annotations')
    }
  }
})

test('Install UI extension', async({ page, ui }) => {
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
      await apps.addRepository({ name: 'sbomscanner-extension-github', url: 'https://neuvector.github.io/security-ui-exts/' })
    })
  }

  await test.step('Install or developer load extension', async() => {
    await extensions.goto()
    if (conf.ui_from === 'source') {
      await extensions.developerLoad(conf.src_url)
    } else {
      await extensions.install('SBOMScanner', { version: process.env.UIVERSION?.replace(/^sbomscanner-ui-ext-/, '') })
    }
  })
})

test('Install SBOMScanner', async({ page }) => {
  const sbomPage = new SbomScannerPage(page)
  await sbomPage.install()
  await sbomPage.goto()
})

test.describe('Setup', () => {
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

  test.skip('Configure WorkloadScan', async({ ui, nav }) => {
    await nav.cluster()
    await ui.importYaml(`
apiVersion: sbomscanner.kubewarden.io/v1alpha1
kind: WorkloadScanConfiguration
metadata:
  name: default
spec:
  # artifactsNamespace: sbomscanner / cattle-sbomscanner-system
  namespaceSelector:
    matchLabels:
      sbomscanner.kubewarden.io/workloadscan: "true"
  platforms:
    - arch: amd64
      os: linux
`)
  })

  test('Add Rancher VEX hub', async({ page }) => {
    const hub: VexHub = {
      name: 'rancher-vexhub',
      uri : 'https://github.com/rancher/vexhub'
    }
    const sbomPage = new SbomScannerPage(page)
    await sbomPage.addVexHub(hub)
  })

  test('Image CVE policy', async({ page }) => {
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

  test('Sample deployment', async({ page, shell }) => {
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
})

test('Check deployment compliance', async({ page, ui, nav }) => {
  await nav.sbomScanner('Registries configuration')
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
