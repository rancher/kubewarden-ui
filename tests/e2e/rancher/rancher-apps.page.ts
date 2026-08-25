import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { RancherUI, type YAMLPatch } from '../components/rancher-ui'
import { step } from './rancher-test'
import { BasePage } from './basepage'

export interface Repo {
  // type: 'http'|'git'|'oci'
  name        : string
  url         : string
  branch?     : string // Git specific
  skipTLS?    : boolean // OCI specific
  annotations?: Record<string, string>
  authSecret?: string | RegExp | {
    username: string
    password: string
  }
}

export interface Chart {
  title      : string // Exact chart title displayed in Rancher
  check      : string // Used to check for helm success, chart name or tgz
  name?      : string // Desired chart name
  version?   : string
  namespace? : string
  project?   : string
  pullSecret?: string | RegExp | {
    username: string
    password: string
  }
}

export class RancherAppsPage extends BasePage {
  readonly step1     : Locator
  readonly step2     : Locator
  readonly stepTitle : Locator
  readonly nextBtn   : Locator
  readonly installBtn: Locator
  readonly updateBtn : Locator

  constructor(page: Page) {
    super(page)
    this.step1 = page.getByRole('heading', { name: 'Install: Step 1' }).or(this.page.getByRole('tab', { name: 'Metadata', selected: true })).first()
    this.step2 = page.getByRole('heading', { name: 'Install: Step 2' }).or(this.page.getByRole('tab', { name: 'Values', selected: true })).first()
    this.stepTitle = page.locator('div.top.choice-banner>.title')
    this.nextBtn = this.ui.button('Next')
    this.installBtn = this.ui.button(/Install|Install this version/)
    this.updateBtn = this.ui.button(/Update|Upgrade|Save changes/)
  }

  async goto(): Promise<void> {
    // await this.nav.explorer('Apps', 'Charts')
    await this.nav.goto('dashboard/c/local/apps/charts')
  }

  // Modify installed app version
  async swapUrlVersion(version: string) {
    await this.ui.swapUrlParams({ version: version }, /.*\/apps\/charts\/install.*chart=/)
    await expect(this.stepTitle).toContainText(version)
  }

  async setRepoType(type: 'Git' | 'OCI' | 'Helm' | 'AppCo') {
    const name = type === 'AppCo' ? 'SUSE App Collection' : type + ' Repository'
    if (RancherUI.isVersion('>=2.14')) {
      await this.page.getByRole('heading', { name, exact: true }).click()
    } else {
      await this.page.getByRole('radio', { name: type === 'Helm' ? 'http(s) URL' : name }).check()
    }
  }

  /**
   * Add helm charts repository to local cluster
   * @param name
   * @param url Git or http(s) url of the repository
   */
  @step
  async addRepository(repo: Repo, options?:{ skipExisting?: boolean }) {
    // Renamed Create -> Add Repository in rancher 2.15
    const createBtn = this.ui.button(/Create|Add Repository/)

    await this.nav.explorer('Apps', 'Repositories')
    if (options?.skipExisting) {
      await this.ui.tableRow(0).waitFor()
      if (await this.ui.tableRow(repo.name).row.isVisible()) return
    }
    await createBtn.click()

    await this.ui.input('Name *').fill(repo.name)
    if (repo.url.endsWith('.git')) {
      // Git repository
      await this.setRepoType('Git')
      await this.ui.input('Git Repo URL *').fill(repo.url)
    } else if (repo.url.startsWith('oci://')) {
      // OCI repository
      await this.setRepoType('OCI')
      await this.ui.input('OCI Repository Host URL *').fill(repo.url)
      if (repo.skipTLS !== undefined)
        await this.ui.checkbox('Skip TLS Verifications').setChecked(repo.skipTLS)
    } else if (repo.url.startsWith('http')) {
      // HTTP(s) repository
      await this.setRepoType('Helm')
      await this.ui.input('Index URL *').fill(repo.url)
    } else {
      // Application Collection repository
      await this.setRepoType('AppCo')
    }

    if (repo.authSecret) {
      if (repo.authSecret instanceof RegExp) {
        await this.ui.selectOption('Authentication', repo.authSecret)
      } else if (typeof repo.authSecret == 'string') {
        await this.ui.selectOption('Authentication', new RegExp(`^${repo.authSecret} `))
      } else {
        await this.ui.selectOption('Authentication', 'Create an HTTP Basic Auth Secret')
        await this.ui.input('Username').fill(repo.authSecret.username)
        await this.ui.input('Password').fill(repo.authSecret.password)
      }
    }
    if (repo.annotations) {
      for (const [key, value] of Object.entries(repo.annotations)) {
        await this.ui.button('Add Annotation').click()
        await this.page.getByPlaceholder('e.g. foo').last().fill(key)
        await this.page.getByPlaceholder('e.g. bar').last().fill(value)
      }
    }
    // Give generated fields time to get registered
    await this.page.waitForTimeout(200)
    await createBtn.click()
    // Transitions: Active ?> In Progress ?> [Active|InProgress] - https://github.com/rancher/dashboard/issues/10079
    const repoRow = await this.ui.tableRow(repo.name).waitFor()
    // Wait out first Active state
    await this.page.waitForTimeout(1000)
    // Refresh for occasional freeze In Progress
    await repoRow.action('Refresh')
    // Prevent matching Active before refresh is processed
    await this.page.waitForTimeout(1000)
    await repoRow.toBeActive()
  }

  @step
  async deleteRepository(repo: string|Repo) {
    await this.nav.explorer('Apps', 'Repositories')
    const repoName = typeof repo === 'string' ? repo : repo.name
    await this.ui.tableRow(repoName).delete()
  }

  /**
     * Build regex matching chart name or archive for a successfull installation
     * SUCCESS: helm upgrade ... rancher-kubewarden-defaults /home/shell/helm/kubewarden-defaults-1.7.3.tgz
     * SUCCESS: helm [install|upgrade] [--generate-name=true|name]  /home/shell/helm/opentelemetry-operator-0.38.0.tgz
     */
  async waitHelmSuccess(text: string, options?: { timeout?: number, keepLog?: boolean }) {
    const timeout = options?.timeout || 2 * 60_000
    const keepLog = options?.keepLog || false

    // Can't match ^..$ because output is sometimes mixed up
    const rmMatch = `uninstall.*\\s${text}` // delete app
    const nameMatch = `\\s${text}\\s\\/home` // app upgrades
    const tarMatch = `helm\\/${text}-[0-9-.]+tgz` // chart installations
    const regex = new RegExp(`SUCCESS: helm.*(${nameMatch}|${tarMatch}|${rmMatch})`)

    const passedMsg = this.page.locator('div.logs-container').locator('span.msg').getByText(regex)
    await expect(passedMsg).toBeVisible({ timeout })
    // Close the window
    if (keepLog === false) {
      const win = this.page.locator('#windowmanager').or(this.page.locator('div#horizontal-window-manager'))
      await win.locator('div.tab.active').locator('i.closer').click()
    }
  }

  @step
  async checkChart(name: string|RegExp, version?: string) {
    const row = this.ui.tableRow(name)
    await row.toHaveState('Deployed')
    if (version) {
      await expect(row.column('Chart')).toContainText(`:${version}`)
    }
  }

  //   // Chart-specific setup
  //   if (chart.name === 'jaeger-operator') {
  //     await shell.run(`helm install ${chart.name} ${appCoRepo.url}/jaeger-operator -n ${ns} --set jaeger.create=true --set rbac.clusterRole=true --set image.imagePullSecrets[0]=application-collection`, shellOpts)
  //     // Workaround for jaeger issue https://github.com/jaegertracing/helm-charts/issues/581
  //     await shell.run('kubectl get clusterrole jaeger-operator -o json | jq \'.rules[] |= (select(.apiGroups | index("networking.k8s.io")).resources += ["ingressclasses"])\' | kubectl apply -f -', shellOpts)
  //     // Patch SA to use pull secret for jaeger creation (retry waits for SA creation)
  //     await shell.retry(`kubectl patch serviceaccount jaeger-operator-jaeger -n ${ns} -p '{"imagePullSecrets": [{"name": "application-collection"}]}'`, shellOpts)
  //   }

  @step
  async installChart(chart: Chart, options?: { questions?: () => Promise<void>, yamlPatch?: YAMLPatch, timeout?: number, navigate?: boolean }) {
    // Apps grid was redesigned in Rancher 2.12
    const card = this.page.locator('.grid > .item').or(this.page.locator('.app-chart-cards > .item-card'))
      .filter({ has: this.page.getByRole('heading', { name: chart.title, exact: true }) })

    // Select chart by title
    if (options?.navigate !== false) {
      await this.nav.explorer('Apps', 'Charts')
      await expect(this.page.getByRole('heading', { name: 'Charts', exact: true })).toBeVisible()
      // Handle infinite list scrolling
      if (!await card.isVisible()) {
        await this.page.getByTestId('charts-filter-input').fill(chart.title)
      }
      await card.click()

      if (chart.version) {
        const versionPane = this.page.getByRole('heading', { name: 'Chart Versions', exact: true }).locator('..')
        const showMore = versionPane.getByText('Show More', { exact: true })
        const chartVersion = versionPane.getByText(chart.version, { exact: true }).first()

        await expect(versionPane).toBeVisible()
        // Expand versions
        if (await showMore.isVisible()) await showMore.click()
        // Select requested version
        await chartVersion.click()
        // Active version has bold text, not active are links
        await expect(versionPane.locator('b', { has: this.page.getByText(chart.version, { exact: true }) })).toBeVisible()
      }
      await this.installBtn.click()
    }

    // Chart metadata
    await expect(this.step1).toBeVisible()
    if (chart.name) {
      await this.ui.input('Name').fill(chart.name)
    }
    if (chart.namespace) {
      await this.ui.selectOption('Namespace *', /^Create a [nN]ew Namespace$/)
      await this.ui.input('Namespace').fill(chart.namespace)
    }
    if (chart.project) {
      await this.ui.selectOption('Install into Project', chart.project)
    }
    if (chart.pullSecret) {
      // Alternative: A new Image Pull Secret <name>-image-pull-secret will be generated from the Repository secret <name>
      await this.ui.checkbox('Manually select an Image Pull Secret').check()
      if (chart.pullSecret instanceof RegExp) {
        await this.ui.selectOption('Image Pull Secret', chart.pullSecret)
      } else if (typeof chart.pullSecret == 'string') {
        // Secret has additional "(Registry: ...)" text
        await this.ui.selectOption('Image Pull Secret', new RegExp(`^${chart.pullSecret} `))
      } else {
        await this.ui.selectOption('Image Pull Secret', /Create (an|a new) Image Pull Secret/)
        await this.ui.input('Username').fill(chart.pullSecret.username)
        await this.ui.input('Password').fill(chart.pullSecret.password)
      }
    }
    await this.nextBtn.click()

    // Chart questions
    if (options?.questions) await options.questions()
    if (options?.yamlPatch) {
      await this.ui.openView('Edit YAML')
      await this.ui.editYaml(options.yamlPatch)
      await this.ui.openView('Compare Changes')
    }

    // Installation & Wait
    await this.installBtn.click()
    await this.waitHelmSuccess(chart.check, { timeout: options?.timeout })
  }

  @step
  async updateApp(name: string, options?: { questions?: () => Promise<void>, yamlPatch?: YAMLPatch, timeout?: number, navigate?: boolean, version?: string|RegExp|number }) {
    if (options?.navigate !== false) {
      await this.nav.explorer('Apps', 'Installed Apps')
      await expect(this.page.getByRole('heading', { name: 'Installed Apps' })).toBeVisible()

      // Edit/Upgrade -> Edit/Change version (Rancher 2.14+)
      await this.ui.tableRow(name).action(/^\s*Edit/)
      await expect(this.page.getByRole('heading', { name })).toBeVisible()
    }

    // Step 1
    let v = options?.version
    if (v !== undefined) {
      // Translate 1.9.3 -> ^\s*1[.]9[.]3\s
      if (typeof v === 'string') v = new RegExp(`^\\s*${v.replace(/[.]/g, '[.]')}\\s`)
      await this.ui.selectOption('Version', v)
    }
    await this.nextBtn.click()

    // Step 2
    if (options?.questions) await options.questions()
    if (options?.yamlPatch) {
      await this.ui.openView('Edit YAML')
      await this.ui.editYaml(options.yamlPatch)
      await this.ui.openView('Compare Changes')
    }

    await this.updateBtn.click()
    await this.waitHelmSuccess(name, { timeout: options?.timeout })

    // List of installed apps is empty if we navigate right after update
    await this.page.waitForTimeout(3000)
  }

  @step
  async deleteApp(name: string) {
    await this.nav.explorer('Apps', 'Installed Apps')
    await expect(this.page.getByRole('heading', { name: 'Installed Apps' })).toBeVisible()
    // Row is visible until helm uninstalls app
    await this.ui.tableRow(name).delete({ timeout: 60_0000 })
    await this.waitHelmSuccess(name)
  }
}
