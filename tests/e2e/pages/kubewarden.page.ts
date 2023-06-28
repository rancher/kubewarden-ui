import { expect, Page } from '@playwright/test';
import { BasePage } from './basepage';

export class KubewardenPage extends BasePage {
  constructor(page: Page) {
    super(page, 'dashboard/c/local/kubewarden');
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
    await this.page.goto('dashboard/c/local/kubewarden');
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
    // Rancher Application Install
    await this.page.getByRole('button', { name: 'Next' }).click();

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
