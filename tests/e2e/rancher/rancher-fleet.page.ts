import type { Locator, Page } from '@playwright/test'
import type { YAMLPatch } from '../components/rancher-ui'
import { step, expect } from './rancher-test'
import { BasePage } from './basepage'

export interface GitRepo {
  name          : string
  url           : string
  branch        : string
  selfHealing?  : boolean
  keepResources?: boolean
  paths?        : string[]
  yamlPatch?    : YAMLPatch
  workspace?    : string
}

export class RancherFleetPage extends BasePage {
  readonly updateBtn: Locator

  constructor(page: Page) {
    super(page)
    this.updateBtn = this.ui.button('Update')
  }

  async goto(): Promise<void> {
    // await this.nav.fleet('', 'Dashboard')
    await this.nav.goto('dashboard/c/local/fleet')
  }

  async selectWorkspace(workspace: string) {
    await this.ui.selectOption(this.page.getByTestId('workspace-switcher'), workspace)
  }

  @step
  async addRepository(repo: GitRepo) {
    // Rancher navigation
    await this.nav.fleet('', 'Git Repos')
    await this.ui.button('Add Repository').first().click()
    await expect(this.page.getByRole('heading', { name: 'Create: Step 1', exact: true })).toBeVisible()

    if (repo.workspace !== undefined) await this.selectWorkspace(repo.workspace)

    // Define metadata details
    await this.ui.input('Name *').fill(repo.name)
    await this.ui.button('Next').click()

    // Define repository details
    await expect(this.page.getByRole('heading', { name: 'Create: Step 2', exact: true })).toBeVisible()
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

    // Define target details
    await expect(this.page.getByRole('heading', { name: 'Create: Step 3', exact: true })).toBeVisible()
    await this.ui.button('Next').click()

    // Define advanced settings
    await expect(this.page.getByRole('heading', { name: 'Create: Step 4', exact: true })).toBeVisible()
    if (repo.selfHealing !== undefined) await this.ui.checkbox('Enable Self-Healing').setChecked(repo.selfHealing)
    if (repo.keepResources !== undefined) await this.ui.checkbox('Always Keep Resources').setChecked(repo.keepResources)

    // Customize yaml
    if (repo.yamlPatch) {
      await this.ui.openView('Edit as YAML')
      await this.ui.editYaml(repo.yamlPatch)
    }
    await this.ui.button('Create').click()

    // Get row and wait for Active state
    return await this.ui.tableRow(repo.name).waitFor({ state: 'Active' })
  }

  @step
  async deleteRepository(name: string) {
    await this.nav.fleet('', 'Git Repos')
    await this.ui.tableRow(name).delete()
  }
}
