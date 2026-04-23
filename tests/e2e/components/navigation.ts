import { expect, Page, Locator, test } from '@playwright/test'
import { step } from '../rancher/rancher-test'
import { RancherUI } from './rancher-ui'
import { RancherCommonPage } from '../rancher/rancher-common.page'

// Explorer navigation
type ENav = 'Cluster' | 'Workloads' | 'Apps' | 'Storage' | 'Admission Policy Management' | 'SBOMScanner'
type ENavMap = {
  'Cluster'                    : 'Projects/Namespaces' | 'Nodes' | 'Cluster and Project Members' | 'Events'
  'Workloads'                  : 'CronJobs' | 'DaemonSets' | 'Deployments' | 'Jobs' | 'StatefulSets' | 'Pods'
  'Apps'                       : 'Charts' | 'Installed Apps' | 'Repositories' | 'Recent Operations'
  'Storage'                    : 'PersistentVolumes' | 'StorageClasses' | 'ConfigMaps' | 'PersistentVolumeClaims' | 'Secrets'
  'Admission Policy Management': 'Policy Servers' | 'Cluster Admission Policies' | 'Admission Policies' | 'Policy Reporter'
  'SBOMScanner'                : 'Images' | 'Advanced'
}
// Expandable items in ENavMap that have a third navigation level
type ENavSubMap = {
  SBOMScanner: {
    Advanced: 'Workloads Scan' | 'VEX Management' | 'Registries configuration'
  }
}
// Returns valid sub-items for a given group and child
type ENavChild<T extends ENav, C extends ENavMap[T]> =
  T extends keyof ENavSubMap
    ? C extends keyof ENavSubMap[T]
      ? ENavSubMap[T][C]
      : never
    : never

// Fleet navigation
// Rancher v2.12 renamed Advanced to Resources
type FNav = 'Dashboard' | 'Git Repos' | 'App Bundles' | 'Clusters' | 'Cluster Groups' | 'Workspaces' | 'Advanced' | 'Resources'
type FNavMap = {
  Advanced : 'Workspaces' | 'BundleNamespaceMappings' | 'Bundles' | 'Cluster Registration Tokens' | 'GitRepoRestrictions'
  Resources: 'Git Repos' | 'Helm Ops' | 'BundleNamespaceMappings' | 'Bundles' | 'Cluster Registration Tokens' | 'GitRepoRestrictions'
}
type FNavChild<T extends FNav> = T extends keyof FNavMap ? FNavMap[T] : never

export interface Cluster {
  id  : string
  name: string
}

export class Navigation {
  readonly page: Page
  readonly testCluster = { id: 'local', name: 'local' }

  constructor(private readonly ui: RancherUI) {
    this.page = ui.page
    if (process.env.CLUSTER && process.env.CLUSTER_ID) {
      this.testCluster = { id: process.env.CLUSTER_ID, name: process.env.CLUSTER }
    }
  }

  isblank(): boolean {
    return this.page.url() === 'about:blank'
  }

  // User menu
  async userNav(to: 'Preferences' | 'Account & API Keys' | 'Log Out') {
    if (this.isblank()) await this.page.goto('/')

    const menuItem = RancherUI.isVersion('<=2.10')
      ? this.page.getByTestId('user-menu-dropdown').getByRole('link', { name: to, exact: true })
      : this.page.getByLabel('User Menu').getByRole('menuitem', { name: to, exact: true })

    await this.ui.retry(async() => {
      await this.page.getByTestId('nav_header_showUserMenu').click()
      await menuItem.click({ timeout: 2000 })
    }, 'User menu occasionally does not open', { reload: false })
  }

  private async sideNavHandler(groupName: string, childName?: string, subChildName?: string) {
    const expand = async(block: Locator) => {
      await expect(block).toBeVisible()
      if (!await block.getByRole('list').first().isVisible()) {
        await block.locator('i.icon-chevron-right').click()
      }
    }
    const groupBlock = this.page.locator('nav.side-nav .accordion', { has: this.page.getByText(groupName, { exact: true }) })

    if (!childName) {
      await groupBlock.getByText(groupName, { exact: true }).click()
      return
    }

    await expand(groupBlock)
    const childBlock = groupBlock.getByRole('listitem').filter({ has: this.page.getByText(childName, { exact: true }) })

    if (subChildName) await expand(childBlock)
    await childBlock.getByText(subChildName || childName, { exact: true }).click()
  }

  @step
  async fleet<T extends FNav>(groupName?: T, childName?: FNavChild<T>) {
    await this.mainNav('Continuous Delivery')
    if (!groupName) return

    // Backwards compatibility overrides
    if (RancherUI.isVersion('<=2.11')) {
      if (childName == 'Git Repos') return await this.sideNavHandler('Git Repos')
      if (groupName == 'Resources') return await this.sideNavHandler('Advanced', childName)
    }
    await this.sideNavHandler(groupName, childName)
  }

  @step
  async explorer<T extends ENav, C extends ENavMap[T]>(groupName: T, childName?: C, subChildName?: ENavChild<T, C>) {
    if (this.isblank()) await this.cluster()
    await this.sideNavHandler(groupName, childName, subChildName)

    // Handle empty tables - https://github.com/rancher/rancher/issues/54281
    if (childName === 'Installed Apps' || childName === 'CronJobs') {
      const row = this.ui.tableRow(/^(rancher|audit-scanner)$/).row
      await expect(row).toBeVisible().catch(async() => {
        test.info().annotations.push({ type: 'Table is empty', description: 'Resetting namespace filter' })
        const rancher = new RancherCommonPage(this.page)
        await rancher.setNamespaceFilter('All Namespaces')
        await expect(row).toBeVisible()
      })
    }

    // Wait for page before next step
    if (groupName == 'Admission Policy Management') {
      const heading = childName || /^(Admission Policy Management|Admission Policy Management)$/
      if (childName != 'Policy Reporter') {
        await expect(this.page.getByRole('heading', { name: heading })).toBeVisible()
      }
    }
  }

  // Wrapper for page.goto using default cluster
  async goto(to: string) {
    await this.page.goto(to.replace('dashboard/c/local/', `dashboard/c/${this.testCluster.id}/`))
  }

  // Main menu
  async mainNav(to: 'Home' | 'Continuous Delivery' | 'Cluster Management' | 'Virtualization Management' | 'Users & Authentication' | 'Extensions' | 'Global Settings' | 'About') {
    if (this.isblank()) await this.page.goto('/')

    await this.page.getByTestId('top-level-menu').click()
    await this.page.getByTestId('side-menu').getByRole('link', { name: to }).click()
  }

  // Cluster by name
  async cluster(name?: string) {
    if (this.isblank()) {
      await this.goto(`dashboard/c/${name || this.testCluster.id}/explorer`)
    } else {
      await this.page.getByTestId('top-level-menu').click()
      await this.page.getByTestId('side-menu').locator('div.cluster-name', { hasText: name || this.testCluster.name }).click()
    }
  }

  // ==================================================================================================
  // Kubewarden specific helpers

  @step // Dashboard
  async kubewarden(childName?: ENavMap['Admission Policy Management']) {
    await this.explorer('Admission Policy Management', childName)
  }

  @step // Policy Servers
  async pservers(name?: string, tab?: 'Policies' | 'Metrics' | 'Tracing' | 'Conditions' | 'Recent Events' | 'Related Resources') {
    await this.explorer('Admission Policy Management', 'Policy Servers')
    if (name) {
      await this.ui.tableRow(name).open()
      await expect(this.page.getByRole('heading', { name: new RegExp(`Policy Servers:? ${name}`) })).toBeVisible()
    }
    if (tab) await this.ui.tab(tab).click()
  }

  @step // Cluster Admission Policies
  async capolicies(name?: string, tab?: 'Rules' | 'Tracing' | 'Metrics' | 'Conditions' | 'Recent Events' | 'Related Resources') {
    await this.explorer('Admission Policy Management', 'Cluster Admission Policies')
    if (name) await this.ui.tableRow(name).open()
    if (tab) await this.ui.tab(tab).click()
  }

  @step // Admission Policies
  async apolicies(name?: string, tab?: 'Rules' | 'Tracing' | 'Metrics' | 'Conditions' | 'Recent Events') {
    await this.explorer('Admission Policy Management', 'Admission Policies')
    if (name) await this.ui.tableRow(name).open()
    if (tab) await this.ui.tab(tab).click()
  }

  // ==================================================================================================
  // SBOMScanner specific helpers

  @step
  async sbomScanner(childName?: ENavMap['SBOMScanner'] | ENavChild<'SBOMScanner', ENavMap['SBOMScanner']>) {
    // Shortcut to Advanced sub-items
    if (childName === 'VEX Management' || childName === 'Workloads Scan' || childName === 'Registries configuration') {
      await this.explorer('SBOMScanner', 'Advanced', childName)
    } else {
      await this.explorer('SBOMScanner', childName)
    }

    const heading = childName || /^(Dashboard|Install SBOMScanner)/
    await expect(this.page.locator('div.title').getByText(heading)).toBeVisible()
  }
}
