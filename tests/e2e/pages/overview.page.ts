import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './basepage';

export class OverviewPage extends BasePage {
  readonly createPsBtn: Locator;
  readonly createApBtn: Locator;
  readonly createCapBtn: Locator;

  constructor(page: Page) {
    super(page, 'dashboard/c/local/kubewarden');
    this.createPsBtn = page.getByRole('link', {name: 'Create Policy Server', exact: true})
    this.createApBtn = page.getByRole('link', {name: 'Create Admission Policy', exact: true})
    this.createCapBtn = page.getByRole('link', {name: 'Create Cluster Admission Policy', exact: true})
  }

  getPane(name: 'Policy Servers'|'Admission Policies'|'Cluster Admission Policies' ) {
    return this.page.locator('div.card-container').filter({
      has:this.page.getByRole('heading', {name: name, exact: true})})
  }

  async installKubewarden() {
    // ==================================================================================================
    // Requirements Dialog
    const welcomeStep = this.page.getByText('Kubewarden is a policy engine for Kubernetes.');
    const addRepoStep = this.page.getByRole('heading', { name: 'Repository', exact: true });
    const appInstallStep = this.page.getByRole('heading', { name: 'Kubewarden App Install', exact: true });
    const installBtn = this.page.getByRole('button', { name: 'Install Kubewarden', exact: true });
    const addRepoBtn = this.page.getByRole('button', { name: 'Add Kubewarden Repository', exact: true });
    const failRepo = this.page.getByText('Unable to fetch Kubewarden Helm chart');
    const failRepoBtn = this.page.getByRole('button', { name: 'Reload', exact: true });

    // Welcome screen
    await this.goto();
    await expect(welcomeStep).toBeVisible();
    await installBtn.click();

    // Add repository screen (shows if repo does not exist)
    if (await addRepoStep.isVisible()) {
      await addRepoBtn.click();
    }

    // Wait for install button or handle repo failure
    try {
      await expect(installBtn).toBeVisible();
    } catch (e) {
      await expect(failRepo).toBeVisible();
      await failRepoBtn.click();
      await expect(welcomeStep).toBeVisible();
      await installBtn.click();
    }

    // Cert-Manager

    // Redirection to rancher app installer
    await expect(appInstallStep).toBeVisible();
    await installBtn.click();
    await expect(this.page).toHaveURL(/.*\/apps\/charts\/install.*chart=kubewarden-controller/);

    // ==================================================================================================
    // Rancher Application Metadata
    await this.page.getByRole('button', { name: 'Next' }).click();
    // Rancher Application Values
    const schedule = this.ui.input('Schedule')
    await expect(schedule).toHaveValue('*/60 * * * *')
    await schedule.fill('*/1 * * * *')
    await this.ui.checkbox('Enable Policy Reporter').check()

    // Enable telemetry
    // await page.getByRole('button', { name: 'Edit YAML' }).click()
    // await editYaml(page, d => d.telemetry.enabled = true )
    // await page.getByRole('button', { name: 'Compare Changes' }).click()

    await this.page.getByRole('button', { name: 'Install' }).click();
    await expect(this.ui.helmPassRegex('rancher-kubewarden-crds')).toBeVisible({ timeout: 30_000 });
    await expect(this.ui.helmPassRegex('rancher-kubewarden-controller')).toBeVisible({ timeout: 60_000 });
  }

  async whitelistArtifacthub() {
    await expect(this.page.getByText('Official Kubewarden policies are hosted on ArtifactHub')).toBeVisible();
    await this.page.getByRole('button', { name: 'Add ArtifactHub To Whitelist' }).click();
  }
}
