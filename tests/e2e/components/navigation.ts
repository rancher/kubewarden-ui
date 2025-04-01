import { expect, Page } from '@playwright/test'
import { step } from '../rancher/rancher-test'
import { RancherUI } from './rancher-ui'

type ExpGroup = 'Cluster' | 'Workloads' | 'Apps' | 'Storage' | 'Admission Policy Management'
type ExpItemMap = {
    Cluster: 'Projects/Namespaces' | 'Nodes' | 'Cluster and Project Members' | 'Events'
    Workloads: 'CronJobs' | 'DaemonSets' | 'Deployments' | 'Jobs' | 'StatefulSets' | 'Pods'
    Apps: 'Charts' | 'Installed Apps' | 'Repositories' | 'Recent Operations'
    Storage: 'PersistentVolumes' | 'StorageClasses' | 'ConfigMaps' | 'PersistentVolumeClaims' | 'Secrets'
    'Admission Policy Management': 'PolicyServers' | 'ClusterAdmissionPolicies' | 'AdmissionPolicies' | 'Policy Reporter'
};

type FleetGroup = '' | 'Advanced'
type FleetItemMap = {
    '': 'Dashboard' | 'Git Repos' | 'Clusters' | 'Cluster Groups'
    'Advanced': 'Workspaces' | 'BundleNamespaceMappings' | 'Bundles' | 'Cluster Registration Tokens' | 'GitRepoRestrictions'
};

export interface Cluster {
  id: string,
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

    private async sideNavHandler(groupName: string, childName?: string) {
      const groupHeader = this.page.getByRole('heading', { name: groupName, exact: true })
      let groupBlock = this.page.locator('nav.side-nav').locator('.accordion')
      if (groupName) groupBlock = groupBlock.filter({ has: groupHeader })

      // Expand group if needed
      if (groupName && childName) {
        const expandBtn = groupBlock.locator('i.icon-chevron-down,i.icon-chevron-right')
        // Can't detect with expandBtn.isVisible, conflict in: icon-down = closed (2.7) = open (2.8)
        await expect(groupBlock).toBeVisible()
        if (!await groupBlock.getByRole('list').isVisible()) {
          await expandBtn.click()
        }
      }
      // Click menu item
      if (childName) {
        await groupBlock.getByText(childName, { exact: true }).click()
      } else {
        await groupBlock.locator(groupHeader).click()
      }

      // 2nd level children not implemented
    }

    @step
    async fleet<T extends FleetGroup>(groupName: T, childName?: FleetItemMap[T]) {
      if (this.isblank()) await this.mainNav('Continuous Delivery')
      await this.sideNavHandler(groupName, childName)
    }

    @step
    async explorer<T extends ExpGroup>(groupName: T, childName?: ExpItemMap[T]) {
      if (this.isblank()) await this.cluster()
      await this.sideNavHandler(groupName, childName)

      // Wait for page before next step
      if (groupName == 'Admission Policy Management') {
        const heading = childName || /^(Kubewarden|Welcome to Kubewarden)$/
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
      if (this.isblank()) { await this.goto(`dashboard/c/${name || this.testCluster.id}/explorer`) } else {
        await this.page.getByTestId('top-level-menu').click()
        await this.page.getByTestId('side-menu').locator('div.cluster-name', { hasText: name || this.testCluster.name }).click()
      }
    }

    // ==================================================================================================
    // Kubewarden specific helpers

    @step // Overview
    async kubewarden(childName?: ExpItemMap['Admission Policy Management']) {
      await this.explorer('Admission Policy Management', childName)
    }

    @step // Policy Servers
    async pservers(name?: string, tab?: 'Policies' | 'Metrics' | 'Tracing' | 'Conditions' | 'Recent Events' | 'Related Resources') {
      await this.explorer('Admission Policy Management', 'PolicyServers')
      if (name) {
        await this.ui.tableRow(name).open()
        await expect(this.page.getByRole('heading', { name: new RegExp(`PolicyServer:? ${name}`) })).toBeVisible()
      }
      if (tab) await this.ui.tab(tab).click()
    }

    @step // Cluster Admission Policies
    async capolicies(name?: string, tab?: 'Rules' | 'Tracing' | 'Metrics' | 'Conditions' | 'Recent Events' | 'Related Resources') {
      await this.explorer('Admission Policy Management', 'ClusterAdmissionPolicies')
      if (name) await this.ui.tableRow(name).open()
      if (tab) await this.ui.tab(tab).click()
    }

    @step // Admission Policies
    async apolicies(name?: string, tab?: 'Rules' | 'Tracing' | 'Metrics' | 'Conditions' | 'Recent Events') {
      await this.explorer('Admission Policy Management', 'AdmissionPolicies')
      if (name) await this.ui.tableRow(name).open()
      if (tab) await this.ui.tab(tab).click()
    }
}
