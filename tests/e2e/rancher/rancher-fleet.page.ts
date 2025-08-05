import type { Locator, Page } from '@playwright/test'
import { RancherUI, type YAMLPatch } from '../components/rancher-ui'
import { test, step, expect } from './rancher-test'
import { BasePage } from './basepage'

interface AppBundle {
  name          : string
  labels?       : Record<string, string>
  workspace?    : 'fleet-default' | 'fleet-local'
  // Fails if a cluster scoped resource is used in the workload manifests, use defaultNamespace
  namespace?    : string
  yamlPatch?    : YAMLPatch
  selfHealing?  : boolean
  keepResources?: boolean
}

interface GitRepo extends AppBundle {
  url   : string
  branch: string
  paths?: string[]
}

interface HelmOp extends AppBundle {
  release: string
  // type : 'Repository' | 'OCI Registry' | 'Tarball'
  repo: {
    url     : string
    chart   : string
    version?: string
  }
  values?: YAMLPatch
}

export class RancherFleetPage extends BasePage {
  readonly updateBtn: Locator

  constructor(page: Page) {
    super(page)
    this.updateBtn = this.ui.button('Update')
  }

  get navGroup() {
    return RancherUI.isVersion('>=2.12') ? 'Resources' : ''
  }

  async goto(): Promise<void> {
    // await this.nav.fleet('', 'Dashboard')
    await this.nav.goto('dashboard/c/local/fleet')
  }

  async selectWorkspace(workspace: string) {
    await this.ui.selectOption(this.page.getByTestId('workspace-switcher'), workspace)
  }

  private async addBundle(bundle: GitRepo | HelmOp, typeSpecificSteps: () => Promise<void>, options?: { timeout?: number }) {
    await expect(this.page.getByRole('heading', { name: 'Create: Step 1', exact: true })).toBeVisible()
    await this.selectWorkspace(bundle.workspace || 'fleet-local')

    // Define metadata details
    await test.step('Define metadata details', async() => {
      await this.ui.input('Name *').fill(bundle.name)
      if (bundle.labels) {
        for (const [key, value] of Object.entries(bundle.labels)) {
          await this.ui.button('Add Label').click()
          await this.page.getByPlaceholder('e.g. foo').last().fill(key)
          await this.page.getByPlaceholder('e.g. bar').last().fill(value)
        }
        // Wait for generated fields
        await this.page.waitForTimeout(500)
      }
      await this.ui.button('Next').click()
    })

    // GitRepo or HelmOp details
    await typeSpecificSteps()

    // Define target details
    await test.step('Define target details', async() => {
      if (bundle.namespace) await this.ui.input('Target Namespace').fill(bundle.namespace)
      await this.ui.button('Next').click()
    })

    // Define advanced settings
    await test.step('Define advanced settings', async() => {
      if (bundle.selfHealing !== undefined) await this.ui.checkbox('Enable Self-Healing').setChecked(bundle.selfHealing)
      if (bundle.keepResources !== undefined) await this.ui.checkbox('Always Keep Resources').setChecked(bundle.keepResources)
      if (bundle.yamlPatch) {
        await this.ui.openView('Edit as YAML')
        await this.ui.editYaml(bundle.yamlPatch)
      }
      await this.ui.button('Create').click()
    })

    // Wait for Active state
    await test.step('Wait for Active state', async() => {
      const bundleRow = await this.ui.tableRow(bundle.name).waitFor({ state: 'Active' })
      await this.ui.retry(async() => {
        await this.selectWorkspace(bundle.workspace || 'fleet-local')
        await expect(bundleRow.column('Clusters Ready')).toHaveText('1/1', { timeout: options?.timeout })
      }, 'Installed but not refreshed?')
    })
  }

  /**
   * Feature added in Rancher v2.12
   * Example usage: Add OTEL with version from env
   * await fleetPage.addHelmOp({
   *   name   : 'opentelemetry',
   *   release: 'opentelemetry-operator',
   *   repo     : {
   *     url    : 'https://open-telemetry.github.io/opentelemetry-helm-charts',
   *     chart  : 'opentelemetry-operator',
   *     version: process.env.OTEL_OPERATOR
   *   },
   *   values   : { 'manager.collectorImage.repository': 'otel/opentelemetry-collector-contrib' },
   *   yamlPatch: (y) => { y.spec.defaultNamespace = 'open-telemetry' },
   * }, { timeout: 20_000 })
   */
  async addHelmOp(helmop: HelmOp, options?: { timeout?: number }) {
    await this.nav.fleet('Resources', 'Helm Ops')
    await this.ui.button('Create Helm Op').first().click()

    await this.addBundle(helmop, async() => {
      // Define Helm Chart source details
      await test.step('Define Helm Chart source details', async() => {
        await this.ui.input('Name').fill(helmop.release)
        await this.ui.input('URL').fill(helmop.repo.url)
        await this.ui.input('Chart').fill(helmop.repo.chart)
        if (helmop.repo.version) await this.ui.input('Version').fill(helmop.repo.version)
        await this.ui.button('Next').click()
      })

      // Define Helm Values for the chart
      await test.step('Define Helm Values for the chart', async() => {
        if (helmop.values) await this.ui.editYaml(helmop.values)
        await this.ui.button('Next').click()
      })
    }, options)
  }

  async addGitRepo(repo: GitRepo, options?: { timeout?: number }) {
    await this.nav.fleet(this.navGroup, 'Git Repos')
    await this.ui.button('Add Repository').first().click()

    await this.addBundle(repo, async() => {
      // Define repository details
      await test.step('Define repository details', async() => {
        await this.ui.input('Repository URL').fill(repo.url)
        await this.ui.input('Branch Name *').fill(repo.branch)
        if (repo.paths) {
          for (const path of repo.paths) {
            await this.ui.button(/Add Path/).click()
            await this.page.getByPlaceholder('e.g. /directory/in/your/repo').fill(path)
          }
          // Wait for generated fields
          await this.page.waitForTimeout(200)
        }
        await this.ui.button('Next').click()
      })
    }, options)
  }

  @step
  async deleteGitRepo(name: string) {
    await this.nav.fleet(this.navGroup, 'Git Repos')
    await this.ui.tableRow(name).delete()
  }
}
