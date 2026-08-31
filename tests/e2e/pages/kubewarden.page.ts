import { expect, Locator, Page } from '@playwright/test'
import { RancherAppsPage, Repo } from '../rancher/rancher-apps.page'
import { BasePage } from '../rancher/basepage'
import { Shell } from '../components/kubectl-shell'
import { step } from '../rancher/rancher-test'
import { Common } from '../components/common'
import { RancherStoragePage } from '../rancher/rancher-storage.page'
import { RancherUI } from '../components/rancher-ui'

type Pane = 'Policy Servers' | 'Namespaced Policies' | 'Cluster Policies'
// type PaneFilter = 'Policies' | 'Reports' | string | RegExp

export interface AppVersion {
  app        : string
  controller?: string
  crds?      : string
  defaults?  : string
}

// Generated Pull secret has the same name as auth
export const secretName = 'appco-auth-kubewarden'
// Some redirects are based on repo name, it should match official one
const acRepo: Repo = { name: 'admission-controller-charts', url: 'oci://registry.suse.de/devel/jasmine/charts/charts/suse-security-admission-controller', skipTLS: true }

export class KubewardenPage extends BasePage {
  readonly currentApp  : Locator
  readonly upgradeApp  : Locator
  readonly upController: Locator
  readonly upDefaults  : Locator

  constructor(page: Page) {
    super(page)
    const head = this.page.locator('div.head')
    this.currentApp = head.locator('div.head-version')
    this.upgradeApp = head.locator('div.head-upgrade')
    this.upController = head.getByTestId('kw-app-controller-upgrade-button')
    this.upDefaults = head.getByTestId('kw-app-defaults-upgrade-button')
  }

  async goto(): Promise<void> {
    await this.nav.kubewarden()
  }

  getPane(name: Pane) {
    return this.page.locator('div.item-card')
      .filter({ has: this.page.getByRole('heading', { name, exact: true }) })
  }

  getPolicyServer(name: string|RegExp) {
    return this.getPane('Policy Servers')
      .locator('div.resource-row')
      .filter({ has: this.page.getByRole('link', { name, exact: true }) })
  }

  getPolicySummary(pane: Pane, type: 'Policies' | 'Reports') {
    return this.getPane(pane)
      .locator('div.policies-summary')
      .filter({ has: this.page.getByText(type, { exact: true }) })
  }

  getStats(pane: Pane, options?: { server?: string | RegExp, type?: 'Policies' | 'Reports' }) {
    const el = pane === 'Policy Servers'
      ? this.getPolicyServer(options?.server ?? 'default')
      : this.getPolicySummary(pane, options?.type ?? 'Policies')

    const matcher = options?.type === 'Reports' ? /^\d+ reports/ : /^\d+ protect\s*\+\s*\d+ monitor/
    return el.getByText(matcher).or(el.getByText(/No [a-z]+ available/))
  }

  async getCount(pane: Pane, options?: { server?: string | RegExp, type?: 'Policies' | 'Reports', mode?: 'monitor' | 'protect' }) {
    // Special handling for policy servers count
    if (pane === 'Policy Servers' && !options?.server) {
      return await this.getPane('Policy Servers').locator('div.resource-row').count()
    }

    const stats = this.getStats(pane, options)
    await expect(stats).toBeVisible()

    if (await stats.getByText(/^No (policies|reports) available/).isVisible()) return 0

    if (options?.type === 'Reports') {
      return parseInt((await stats.getByText(/^\d+ reports$/).textContent())!, 10)
    }
    const mCount = parseInt((await stats.getByText(/^\d+ monitor$/).textContent())!, 10)
    const pCount = parseInt((await stats.getByText(/^\d+ protect$/).textContent())!, 10)

    if (options?.mode === 'monitor') return mCount
    if (options?.mode === 'protect') return pCount
    return mCount + pCount
  }

  @step
  async getCurrentVersion(): Promise<AppVersion> {
    await this.nav.kubewarden()
    const verText = await this.currentApp.innerText()
    const parts = verText.split(/\s+/)
    return { app: parts[2] }
  }

  @step
  async getUpgrade(): Promise<AppVersion|null> {
    await this.nav.kubewarden()
    if (await this.upgradeApp.isVisible()) {
      // Parse versions from "App Upgrade: v1.9.0 - Controller|Defaults: 2.0.5"
      const upText = await this.upgradeApp.innerText()
      const parts = upText.split(/\s+/)
      return { app: parts[2], controller: parts[5] }
    } else return null
  }

  // Hacky unsupported way to install Admission Controller
  private async installFromGithub(options?: { version?: string }) {
    const appsPage = new RancherAppsPage(this.page)
    await appsPage.addRepository({ name: 'admission-controller-charts', url: 'https://charts.kubewarden.io' })

    await appsPage.installChart(
      { title: 'Admission Controller', check: 'admission-controller', version: options?.version },
      {
        questions: async() => {
          // Rancher Application Values
          await expect(this.ui.checkbox('Enable Background Audit check ')).toBeChecked()
          const schedule = this.ui.input('Schedule')
          await expect(schedule).toHaveValue('0 * * * *')
          await schedule.fill('*/1 * * * *')
          await this.ui.checkbox('Enable Policy Reporter').check()

          // Recommended Policies
          const enableRP = this.ui.checkbox('Enable recommended policies')
          await this.ui.tab('Recommended Policies').click()
          await expect(enableRP).not.toBeChecked()
          await enableRP.check()
          await expect(this.ui.select('Execution mode of the recommended policies ')).toContainText('monitor')
        }
      })
  }

  @step
  async installFrom(from: 'github'|'gitlab'|'prime', options?: { version?: string }) {
    if (from == 'github') return await this.installFromGithub()

    const appsPage = new RancherAppsPage(this.page)
    const secPage = new RancherStoragePage(this.page)

    let acPatch: (y: any) => void | undefined
    if (from == 'gitlab') {
      const gl = Common.findGitLabRefs('Admission Controller')

      acPatch = (y) => {
        for (const node of [y.image, y.policyServer.image, y.auditScanner.image]) {
          node.registry = gl.reg
          node.tag = node.tag.replace(/-.*/, '')
        }
        // Dependencies are not part of MR (enabled by policyReporter=true)
        y.global.imagePullSecrets[0] = secPage.createAppcoPull(secretName, 'cattle-kubewarden-system').name
        // y['policy-reporter'].image = {}
        // y['policy-reporter'].ui.image = {}
        // y['policy-reporter'].image.registry = gl.reg.replace('jasmine', 'orchid')
        // y['policy-reporter'].ui.image.registry = gl.reg.replace('jasmine', 'orchid')
        // y['policy-reporter'].image.tag = 3
        // y['policy-reporter'].ui.image.tag = 2
      }

      // Add & annotate repository (annotation is protected in UI)
      await appsPage.addRepository({ ...acRepo, url: gl.chart })
      await new Shell(this.page).run(`kubectl annotate clusterrepos.catalog.cattle.io ${acRepo.name} catalog.cattle.io/suse-application-collection=true`)

      // To activate installer buttons
      await this.page.reload()
    }

    // Welcome screen
    await this.goto()
    await this.ui.button('Install SUSE Security Admission Controller').click()

    if (from == 'prime') {
      const authSec = secPage.createAppcoAuth(secretName)

      // AppCo Registry Auth
      await this.ui.selectAuthentication(authSec.name)
      await this.ui.button('Continue').click()
      // Add Repository
      await this.ui.button('Add Admission Controller Repository').click()

      // Chart secret UI is not available in Rancher < 2.14
      if (RancherUI.isVersion('<2.14')) {
        acPatch = (y) => {
          y.global.imagePullSecrets[0] = authSec.name
        }
      }
    }

    await this.ui.button('Install SUSE Security Admission Controller').click()
    await appsPage.installChart(
      { title: '-', check: 'suse-security-admission-controller', version: options?.version },
      { navigate : false,
        yamlPatch: (y) => {
          y.recommendedPolicies.enabled = true
          y.auditScanner.policyReporter = true
          y.auditScanner.cronJob.schedule = '*/1 * * * *'
          acPatch?.(y)
        }
      })
  }

  @step
  async upgrade(options?: { from?: AppVersion, to?: AppVersion }) {
    const from = options?.from
    const to = options?.to
    const apps = new RancherAppsPage(this.page)

    const shell = new Shell(this.page)

    // Check versions before upgrade
    if (from) await expect(this.currentApp).toContainText(`App Version: ${from.app}`)
    if (to) await expect(this.upgradeApp).toContainText(`App Upgrade: ${to.app}`)

    // Controller upgrade
    if (to?.controller) await expect(this.upController).toContainText(`Controller: ${to.controller}`)
    await this.upController.click()
    if (from?.controller || to?.controller) {
      await expect(apps.stepTitle).toContainText(`${from?.controller || ''} > ${to?.controller || ''}`)
    }
    await apps.updateApp('rancher-admission-controller', { navigate: false, timeout: 4 * 60_000 })
    // 4.1.0 Error: error while loading policies from "/config/policies.yml": data did not match any variant of untagged enum PolicyOrPolicyGroup
    // 5.0.0 Probe port change from https to http
    if (!to?.controller?.startsWith('4.1') && !to?.controller?.startsWith('5.0')) {
      await shell.waitPods()
    }

    // Defaults upgrade
    await this.nav.kubewarden()
    if (to?.defaults) await expect(this.upDefaults).toContainText(`Defaults: ${to.defaults}`)
    await this.upDefaults.click()
    if (from?.defaults || to?.defaults) {
      await expect(apps.stepTitle).toContainText(`${from?.defaults || ''} > ${to?.defaults || ''}`)
    }
    await apps.updateApp('rancher-kubewarden-defaults', { navigate: false })

    // Check resources are online
    await this.nav.explorer('Apps', 'Installed Apps')
    for (const chart of ['controller', 'crds', 'defaults'] as const) {
      await apps.checkChart(`rancher-kubewarden-${chart}`, to ? to[chart] : undefined)
    }
    await shell.waitPods()
  }
}
