import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import type { YAMLPatch } from '../components/rancher-ui'
import { Shell } from '../components/kubectl-shell'
import { step } from './rancher-test'
import { BasePage } from './basepage'

export interface ChartRepo {
    // type: 'http'|'git'|'oci'
    name: string
    url: string
    httpAuth?: {
        username: string
        password: string
    }
    // Git specific
    branch?: string
}

export interface Chart {
    title: string, // Exact chart title displayed in Rancher
    check: string, // Used to check for helm success, chart name or tgz
    name?: string, // Desired chart name
    version?: string,
    namespace?: string,
    project?: string,
}

export const appColRepo: ChartRepo = {
  name    : 'application-collection',
  url     : 'oci://dp.apps.rancher.io/charts',
  httpAuth: { username: '<user>', password: '<pass>' }
}

export class RancherAppsPage extends BasePage {
    readonly step1: Locator
    readonly step2: Locator
    readonly stepTitle: Locator
    readonly nextBtn: Locator
    readonly installBtn: Locator
    readonly updateBtn: Locator

    constructor(page: Page) {
      super(page)
      this.step1 = page.getByRole('heading', { name: 'Install: Step 1' })
      this.step2 = page.getByRole('heading', { name: 'Install: Step 2' })
      this.stepTitle = page.locator('div.top.choice-banner>.title')
      this.nextBtn = this.ui.button('Next')
      this.installBtn = this.ui.button('Install')
      this.updateBtn = page.getByRole('button', { name: /Update|Upgrade/ })
    }

    async goto(): Promise<void> {
      // await this.nav.explorer('Apps', 'Charts')
      await this.nav.goto('dashboard/c/local/apps/charts')
    }

    async swapUrlVersion(version: string) {
      const url = this.page.url()
      await this.page.goto(url.replace(/version=[0-9.]+(-rc[0-9])?/, `version=${version}`))
      await expect(this.stepTitle).toContainText(version)
    }

    /**
     * Add helm charts repository to local cluster
     * @param name
     * @param url Git or http(s) url of the repository
     */
    @step
    async addRepository(repo: ChartRepo) {
      await this.nav.explorer('Apps', 'Repositories')
      await this.ui.button('Create').click()

      await this.ui.input('Name *').fill(repo.name)
      if (repo.url.endsWith('.git')) {
        // Git repository
        await this.page.getByRole('radio', { name: 'Git repository' }).check()
        await this.ui.input('Git Repo URL *').fill(repo.url)
      } else if (repo.url.startsWith('oci://')) {
        // OCI repository
        await this.page.getByRole('radio', { name: 'OCI repository' }).check()
        await this.ui.input('OCI Repository Host URL *').fill(repo.url)
      } else {
        // HTTP repository
        await this.page.getByRole('radio', { name: 'http(s) URL' }).check()
        await this.ui.input('Index URL *').fill(repo.url)
      }
      if (repo.httpAuth) {
        // Auth takes a moment to load values
        await expect(this.ui.select('Authentication')).toContainText('None')
        await this.ui.selectOption('Authentication', 'Create a HTTP Basic Auth Secret')
        await this.ui.input('Username').fill(repo.httpAuth.username)
        await this.ui.input('Password').fill(repo.httpAuth.password)
      }

      await this.ui.button('Create').click()
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
    async deleteRepository(repo: string|ChartRepo) {
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
      const timeout = options?.timeout || 60_000
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
        const win = this.page.locator('#windowmanager')
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

    @step
    async installFromAppCollection(chart: Chart) {
      const shell = new Shell(this.page)
      const shellOpts = { inPlace: true, runner: 'rancher' } as const
      const ns = chart.namespace || 'default'

      // Configure authentification
      await shell.open()
      // Secret to pull images from app collection
      if (ns !== 'default') await shell.run(`kubectl create ns ${ns}`, shellOpts)
      await shell.run(`kubectl create secret docker-registry application-collection -n ${ns} --docker-server=dp.apps.rancher.io --docker-username=${appColRepo.httpAuth?.username} --docker-password=${appColRepo.httpAuth?.password}`, shellOpts)
      // Login to app collection to access helm chart
      await shell.run(`helm registry login ${appColRepo.url.split('://')[1]} -u ${appColRepo.httpAuth?.username} -p ${appColRepo.httpAuth?.password}`, shellOpts)

      // Chart-specific setup
      if (chart.name === 'jaeger-operator') {
        await shell.run(`helm install ${chart.name} ${appColRepo.url}/jaeger-operator -n ${ns} --set jaeger.create=true --set rbac.clusterRole=true --set image.imagePullSecrets[0]=application-collection`, shellOpts)
        // Workaround for jaeger issue https://github.com/jaegertracing/helm-charts/issues/581
        await shell.run('kubectl get clusterrole jaeger-operator -o json | jq \'.rules[] |= (select(.apiGroups | index("networking.k8s.io")).resources += ["ingressclasses"])\' | kubectl apply -f -', shellOpts)
        // Patch SA to use pull secret for jaeger creation (retry waits for SA creation)
        await shell.retry(`kubectl patch serviceaccount jaeger-operator-jaeger -n ${ns} -p '{"imagePullSecrets": [{"name": "application-collection"}]}'`, shellOpts)
      }
      await shell.close()
    }

    @step
    async installChart(chart: Chart, options?: { questions?: () => Promise<void>, yamlPatch?: YAMLPatch, timeout?: number, navigate?: boolean }) {
      // Select chart by title
      if (options?.navigate !== false) {
        await this.nav.explorer('Apps', 'Charts')
        await expect(this.page.getByRole('heading', { name: 'Charts', exact: true })).toBeVisible()
        await this.page.locator('.grid > .item').getByRole('heading', { name: chart.title, exact: true }).click()

        if (chart.version) {
          const versionPane = this.page.getByRole('heading', { name: 'Chart Versions', exact: true }).locator('..')
          const showMore = versionPane.getByText('Show More', { exact: true })
          const chartVersion = versionPane.getByText(chart.version, { exact: true })

          await expect(versionPane).toBeVisible()
          // Expand versions
          if (await showMore.isVisible()) await showMore.click()
          // Select requested version
          await chartVersion.click()
          // Active version has bold text, not active are links
          await expect(versionPane.locator(`b:text-is("${chart.version}")`)).toBeVisible()
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

        await this.ui.tableRow(name).action('Edit/Upgrade')
        await expect(this.page.getByRole('heading', { name })).toBeVisible()
      }

      // Step 1
      let v = options?.version
      if (v !== undefined) {
        // Translate 1.9.3 -> ^\s*1[.]9[.]3\s
        if (typeof v === 'string') v = new RegExp(`^\\s*${v.replace(/[.]/g, '[.]')}\\s`)
        await this.ui.selectOption('Version', v)

        // Wrong registry - https://github.com/rancher/dashboard/issues/10703
        await expect(this.ui.select('Version')).toBeVisible()
        if (await this.ui.checkbox('Container Registry').isVisible()) {
          await this.page.reload()
        }
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
