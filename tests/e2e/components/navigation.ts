import { expect, Page } from '@playwright/test';

type ExpGroup = 'Cluster' | 'Workloads' | 'Kubewarden' | 'Apps'
type ExpItemMap = {
    Cluster: 'Projects/Namespaces'
    Workloads: 'CronJobs' | 'Deployments' | 'Jobs' | 'Pods'
    Apps: 'Charts' | 'Installed Apps' | 'Repositories'
    Kubewarden: 'PolicyServers' | 'ClusterAdmissionPolicies' | 'AdmissionPolicies' | 'Policy Reporter'
};

export class Navigation {

    constructor(private readonly page: Page) { }

    // User menu
    async userNav(to: 'Preferences' | 'Account & API Keys' | 'Log Out') {
        await this.page.locator('div.user-menu').click()
        await this.page.getByTestId('user-menu-dropdown').getByRole('link', { name: to, exact: true }).click()
    }

    // Main menu - 'Home'|'Extensions'|'Global Settings'|'local'|<cluster>
    async mainNav(to: 'Home'|'Extensions'|'Global Settings'|'local') {
        await this.page.getByTestId('top-level-menu').click()
        await this.page.getByTestId('side-menu').getByRole('link', { name: to, exact: true }).click()
    }

    async cluster(name: string) {
        await this.page.goto(`dashboard/c/${name}/explorer`)
    }

    // Cluster Explorer
    async explorer<T extends ExpGroup>(groupName: T, childName?: ExpItemMap[T]) {
        const groupHeader = this.page.getByRole('heading', { name: groupName, exact: true })
        const groupBlock = this.page.locator('nav.side-nav').locator('.accordion').filter({has: groupHeader})

        // If test is starting with explorer navigation use local cluster
        if (this.page.url() == "about:blank")
            await this.cluster('local')

        if (childName) {
            // Open group if closed
            await expect(groupBlock).toBeVisible()
            if (await groupBlock.locator('i.icon-chevron-down').isVisible()) {
                await groupBlock.locator('i.icon-chevron-down').click()
            }
            await groupBlock.getByText(childName, {exact: true}).click()
        } else {
            await groupBlock.locator(groupHeader).click()
        }
    }

}
