import { expect, test, Locator, Page } from '@playwright/test'
import { RancherAppsPage } from '../rancher/rancher-apps.page'
import { BasePage } from '../rancher/basepage'
import { Shell } from '../components/kubectl-shell'
import { step } from '../rancher/rancher-test'
import { Common } from '../components/common'

type Pane = 'Policy Servers' | 'Namespaced Policies' | 'Cluster Policies'
// type PaneFilter = 'Policies' | 'Reports' | string | RegExp

export interface AppVersion {
  app        : string
  controller?: string
  crds?      : string
  defaults?  : string
}

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

  @step
  async installKubewarden(options?: { version?: string }) {
    // ==================================================================================================
    // Requirements Dialog
    const welcomeStep = this.page.getByText('Kubewarden is a policy engine for Kubernetes.')
    const addRepoStep = this.page.getByRole('heading', { name: 'Repository', exact: true })
    const appInstallStep = this.page.getByRole('heading', { name: 'Kubewarden App Install', exact: true })
    const installBtn = this.ui.button('Install Kubewarden')
    const addRepoBtn = this.ui.button('Add Kubewarden Repository')
    const failRepo = this.page.getByText('Unable to fetch Kubewarden Helm chart')
    const failRepoBtn = this.ui.button('Reload')

    // Welcome screen
    await this.ui.retry(async() => {
      await this.goto()
    }, 'Kubewarden extension not visible')

    await expect(welcomeStep).toBeVisible()
    await installBtn.click()

    // Add repository screen
    await expect(addRepoStep).toBeVisible()
    await addRepoBtn.click()
    // Wait repo state changes between Active / In Progress
    await this.page.waitForTimeout(5_000)

    // Wait for install button or handle repo failure
    try {
      await expect(installBtn).toBeVisible()
    } catch {
      test.info().annotations.push({ type: 'BUG', description: 'Failed to add kw repository' })
      // 2 possible fails
      await expect(failRepo.or(addRepoBtn)).toBeVisible()
      if (await failRepo.isVisible()) {
        await failRepoBtn.click()
      } else {
        await this.page.reload()
      }
      await expect(welcomeStep).toBeVisible()
      await installBtn.click()
    }

    // Redirection to rancher app installer
    await expect(appInstallStep).toBeVisible()
    await installBtn.click()
    await expect(this.page).toHaveURL(/.*\/apps\/charts\/install.*chart=admission-controller/)

    // ==================================================================================================
    // Rancher Application Metadata
    const apps = new RancherAppsPage(this.page)
    // Use custom version if requested
    if (options?.version) await apps.swapUrlVersion(options.version)
    await expect(apps.step1).toBeVisible()
    await apps.nextBtn.click()
    await expect(apps.step2).toBeVisible()

    // Rancher Application Values
    await expect(this.ui.checkbox('Enable Background Audit check ')).toBeChecked()
    const schedule = this.ui.input('Schedule')
    // Value was fixed in Kubewarden 1.36.0, previous versions (current -3) have old value
    await expect(schedule).toHaveValue(process.env.MODE == 'upgrade' ? '*/60 * * * *' : '0 * * * *')
    await schedule.fill('*/1 * * * *')
    await this.ui.checkbox('Enable Policy Reporter').check()

    // Recommended Policies
    const enableRP = this.ui.checkbox('Enable recommended policies')
    await this.ui.tab('Recommended Policies').click()
    await expect(enableRP).not.toBeChecked()
    await enableRP.check()
    await expect(this.ui.select('Execution mode of the recommended policies ')).toContainText('monitor')

    // Start installation
    await apps.installBtn.click()
    await apps.waitHelmSuccess('rancher-admission-controller', { timeout: 4 * 60_000 })
  }

  @step
  async installAppCo() {
    // mrChart: oci://registry.suse.de/devel/jasmine/charts/suse-security/mr-30/charts/suse-security-admission-controller
    // mrReg: registry.suse.de/devel/jasmine/containers/suse-security/mr-38
    const { mrChart, mrReg, mrTag } = await Common.fetchAppCoMr('SUSE Security Admission Controller')

    const appsPage = new RancherAppsPage(this.page)
    await appsPage.addRepository({
      name       : 'appco-ibs',
      url        : mrChart,
      skipTLS    : true,
      annotations: { 'catalog.cattle.io/suse-application-collection': 'true' },
      // httpAuth   : { username: process.env.APPCO_ID || '', password: process.env.APPCO_PW || '' },
    })

    // Add secret in nodejs shell to not log creadentials
    const shell = new Shell(this.page)
    await shell.runExec(`kubectl create secret docker-registry application-collection -n cattle-kubewarden-system \
        --docker-server=dp.apps.rancher.io \
        --docker-username=${process.env.APPCO_ID} \
        --docker-password=${process.env.APPCO_PW}`)

    // Use Kubewarden installer
    await this.nav.kubewarden()
    await this.ui.button('Install Kubewarden').click()
    await expect(this.page.getByRole('heading', { name: 'Kubewarden App Install', exact: true })).toBeVisible()

    await this.ui.button('Install Kubewarden').click()
    // Bug workaround - missing name / namespace
    await appsPage.swapUrlParams({ namespace: 'cattle-kubewarden-system', name: 'rancher-admission-controller' })

    await appsPage.installChart({
      title: 'suse-security-admission-controller',
      check: 'suse-security-admission-controller',
    }, { navigate : false, yamlPatch: (y) => {
      // For images that are not part of MR (policy-reporter, ..)
      y.global.imagePullSecrets[0] = 'application-collection'
      // Point to ephemeral MR registry
      y.image.registry = mrReg
      y.policyServer.image.registry = mrReg
      y.auditScanner.image.registry = mrReg
      // Customize installation
      y.recommendedPolicies.enabled = true
      y.auditScanner.policyReporter = true
      y.auditScanner.cronJob.schedule = '*/1 * * * *'
    } })
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
