import { expect, Page } from '@playwright/test'
import { step } from '../rancher-test'
import { RancherUI } from './rancher-ui'

type ExpGroup = 'Cluster' | 'Workloads' | 'Kubewarden' | 'Apps'
type ExpItemMap = {
    Cluster: 'Projects/Namespaces'
    Workloads: 'CronJobs' | 'Deployments' | 'Jobs' | 'Pods'
    Apps: 'Charts' | 'Installed Apps' | 'Repositories'
    Kubewarden: 'PolicyServers' | 'ClusterAdmissionPolicies' | 'AdmissionPolicies' | 'Policy Reporter'
};

export class Navigation {
    readonly page: Page

    constructor(private readonly ui: RancherUI) {
      this.page = ui.page
    }

    isblank(): boolean {
      return this.page.url() === 'about:blank'
    }

    // User menu
    async userNav(to: 'Preferences' | 'Account & API Keys' | 'Log Out') {
      if (this.isblank()) await this.page.goto('/')

      await this.page.locator('div.user-menu').click()
      await this.page.getByTestId('user-menu-dropdown').getByRole('link', { name: to, exact: true }).click()
    }

    // Main menu
    async mainNav(to: 'Home' | 'Extensions' | 'Global Settings' | 'local' | 'About') {
      if (this.isblank()) await this.page.goto('/')

      await this.page.getByTestId('top-level-menu').click()
      await this.page.getByTestId('side-menu').getByRole('link', { name: to }).click()
    }

    // Cluster by name
    async cluster(name: string) {
      if (this.isblank()) { await this.page.goto(`dashboard/c/${name}/explorer`) } else {
        await this.page.getByTestId('top-level-menu').click()
        await this.page.getByTestId('side-menu').getByRole('link', { name }).click()
      }
    }

    // Cluster Explorer
    @step
    async explorer<T extends ExpGroup>(groupName: T, childName?: ExpItemMap[T]) {
      const groupHeader = this.page.getByRole('heading', { name: groupName, exact: true })
      const groupBlock = this.page.locator('nav.side-nav').locator('.accordion').filter({ has: groupHeader })

      // If test is starting with explorer navigation use local cluster
      if (this.isblank()) await this.cluster('local')

      if (childName) {
        const expandBtn = groupBlock.locator('i.icon-chevron-down,i.icon-chevron-right')

        // Can't detect with expandBtn.isVisible, conflict in: icon-down = closed (2.7) = open (2.8)
        await expect(groupBlock).toBeVisible()
        if (!await groupBlock.getByRole('list').isVisible()) {
          await expandBtn.click()
        }
        await groupBlock.getByText(childName, { exact: true }).click()
      } else {
        await groupBlock.locator(groupHeader).click()
      }
    }

    // Policy Servers
    @step
    async pserver(name?: string, tab?: 'Policies' | 'Metrics' | 'Tracing' | 'Conditions' | 'Recent Events' | 'Related Resources') {
      await this.explorer('Kubewarden', 'PolicyServers')
      if (name) await this.ui.tableRow(name).open()
      if (tab) await this.ui.tab(tab).click()
    }

    // Cluster Admission Policies
    @step
    async capolicy(name?: string, tab?: 'Rules' | 'Tracing' | 'Metrics' | 'Conditions' | 'Recent Events' | 'Related Resources') {
      await this.explorer('Kubewarden', 'ClusterAdmissionPolicies')
      if (name) await this.ui.tableRow(name).open()
      if (tab) await this.ui.tab(tab).click()
    }

    // Admission Policies
    @step
    async apolicy(name?: string, tab?: 'Rules' | 'Tracing' | 'Metrics' | 'Conditions' | 'Recent Events') {
      await this.explorer('Kubewarden', 'AdmissionPolicies')
      if (name) await this.ui.tableRow(name).open()
      if (tab) await this.ui.tab(tab).click()
    }
}
