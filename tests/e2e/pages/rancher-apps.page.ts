import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './basepage';

export interface Chart {
    title: string,    // Exact chart title displayed in Rancher
    check: string,    // Used to check for helm success, chart name or tgz
    name?: string,    // Desired chart name
    version?: string,
    namespace?: string,
    project?: string,
}

export class RancherAppsPage extends BasePage {
    readonly step1: Locator
    readonly step2: Locator
    readonly nextBtn: Locator
    readonly installBtn: Locator
    readonly updateBtn: Locator

    constructor(page: Page) {
        super(page, "dashboard/c/local/apps/charts")
        this.step1 = page.getByRole('heading', { name: 'Install: Step 1' })
        this.step2 = page.getByRole('heading', { name: 'Install: Step 2' })
        this.nextBtn = page.getByRole('button', { name: 'Next' })
        this.installBtn = page.getByRole('button', { name: 'Install' })
        this.updateBtn = page.getByRole('button', { name: 'Update' })
    }

    /**
     * Add helm charts repository to local cluster
     * @param name
     * @param url Git or http(s) url of the repository
     */
    async addRepository(name: string, url: string) {
        await this.page.goto('dashboard/c/local/apps/catalog.cattle.io.clusterrepo/create')

        await this.ui.input('Name *').fill(name)
        if (url.endsWith('.git')) {
            await this.page.getByRole('radio', { name: 'Git repository' }).check()
            await this.ui.input('Git Repo URL *').fill(url)
        } else {
            await this.page.getByRole('radio', { name: 'http(s) URL' }).check()
            await this.ui.input('Index URL *').fill(url)
        }
        await this.page.getByRole('button', { name: 'Create' }).click();

        // Check repository state is Active
        await this.ui.getRow(name).toBeActive()
    }

    /**
     * Build regex matching successfull chart installation
     * SUCCESS: helm upgrade ... rancher-kubewarden-defaults /home/shell/helm/kubewarden-defaults-1.7.3.tgz
     * SUCCESS: helm [install|upgrade] [--generate-name=true|name]  /home/shell/helm/opentelemetry-operator-0.38.0.tgz
     */
    async waitHelmSuccess(text: string, timeout=60_000) {
        // Can't match ^..$ because output is sometimes mixed up
        const regex = new RegExp(`SUCCESS: helm.*${text}`)
        const passedMsg = this.page.locator('div.logs-container').locator('span.msg').getByText(regex)
        await expect(passedMsg).toBeVisible({ timeout: timeout })
    }

    async installChart(chart: Chart, yamlPatch?: Function | string, options?:{timeout?: number}) {
        // Select chart by title
        await this.page.goto('dashboard/c/local/apps/charts')
        await expect(this.page.getByRole('heading', { name: 'Charts', exact: true })).toBeVisible()
        await this.page.locator('.grid > .item').getByRole('heading', { name: chart.title, exact: true }).click()

        if (chart.version) {
            const versionPane = this.page.getByRole('heading', { name: 'Chart Versions', exact: true }).locator('..')
            await versionPane.getByText('Show More', { exact: true }).click()
            // Active version is bold text, not active are links
            await versionPane.getByText(chart.version, { exact: true }).click()
            await expect(versionPane.locator(`b:text-is("${chart.version}")`)).toBeVisible()
        }
        await this.installBtn.click()

        // Chart metadata
        await expect(this.step1).toBeVisible()
        if (chart.name) {
            await this.ui.input('Name').fill(chart.name)
        }
        if (chart.namespace) {
            await this.ui.select('Namespace *', 'Create a New Namespace')
            await this.ui.input('Namespace').fill(chart.namespace)
        }
        if (chart.project) {
            await this.ui.select('Install into Project', chart.project)
        }
        await this.nextBtn.click()

        // Chart questions
        if (yamlPatch) {
            await this.ui.openYamlEditor()
            await this.ui.editYaml(yamlPatch)
            await this.page.getByRole('button', { name: 'Compare Changes', exact: true }).click()
        }

        // Installation & Wait
        await this.installBtn.click()
        await this.waitHelmSuccess(chart.check, options?.timeout)
    }

    // Without parameters only for upgrade/reload
    async updateApp(name: string, yamlPatch?: Function | string, options?:{timeout?: number}) {
        await this.page.goto('dashboard/c/local/apps/catalog.cattle.io.app')
        await expect(this.page.getByRole('heading', { name: 'Installed Apps' })).toBeVisible()

        await this.ui.getRow(name).action('Edit/Upgrade')
        await expect(this.page.getByRole('heading', { name: name })).toBeVisible()
        await this.nextBtn.click()

        // Chart questions
        if (yamlPatch) {
            await this.ui.openYamlEditor()
            await this.ui.editYaml(yamlPatch)
            await this.page.getByRole('button', { name: 'Compare Changes', exact: true }).click()
        }

        await this.updateBtn.click()
        await this.waitHelmSuccess(name, options?.timeout)
    }

}
