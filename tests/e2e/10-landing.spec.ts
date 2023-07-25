import { test, expect } from './rancher-test';
import { OverviewPage } from './pages/overview.page';
import { PolicyServersPage } from './pages/policyservers.page';
import { AdmissionPoliciesPage } from './pages/admissionpolicies.page';
import { ClusterAdmissionPoliciesPage } from './pages/clusteradmissionpolicies.page';

test('Kubewarden Landing page', async({ page, ui }) => {
  const kwPage = new OverviewPage(page);
  await kwPage.goto();
  await expect(page.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()

  await expect(page.getByRole('link', { name: 'Create Policy Server' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create Admission Policy' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create Cluster Admission Policy' })).toBeVisible()

  await expect(page.getByText('Active 6 of 6 Global Policies / 100%')).toBeVisible({timeout:60_000})
  await expect(page.getByText('Active 0 of 0 Namespaced Policies / 0%')).toBeVisible()

  await ui.withReload(async () => {
    expect(page.getByText('Active 1 of 1 Pods / 100%')).toBeVisible()
  }, 'https://github.com/kubewarden/ui/issues/245')
});

test('Policy Servers Landing Page', async({ page, ui }) => {
  const psPage = new PolicyServersPage(page);
  await psPage.goto();

  await expect(page.getByRole('heading', { name: 'PolicyServers' })).toBeVisible()

  // Default policy server
  const psRow = ui.getRow('default')
  await expect(psRow.row).toBeVisible()
  await expect(psRow.column('Status')).toHaveText('Active')
  await expect(psRow.column('Policies')).toHaveText('6')

  // Check there is only default policy server
  await expect(page.locator('td.col-policy-server-status')).toHaveCount(1);
});

test('Cluster Admission Policies Landing page', async({ page }) => {
  const capPage = new ClusterAdmissionPoliciesPage(page);
  await capPage.goto();

  await expect(page.getByRole('heading', { name: 'ClusterAdmissionPolicies' })).toBeVisible()
  await expect(page.locator('.col-policy-status')).toHaveCount(6);
  await expect(page.locator('.col-policy-status').getByText('Active')).toHaveCount(6);
  await expect(page.locator('.col-link-detail').first()).not.toBeEmpty();
});

test('Admission Policies Landing page', async({ page }) => {
  const apPage = new AdmissionPoliciesPage(page);
  await apPage.goto();

  await expect(page.getByRole('heading', { name: 'AdmissionPolicies' })).toBeVisible()
  await expect(page.getByText('There are no rows to show.')).toBeVisible()
});
