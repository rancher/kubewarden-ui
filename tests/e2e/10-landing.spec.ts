import { test, expect } from './rancher-test';

test('Kubewarden Landing page', async({ page, ui, nav }) => {
  await nav.explorer('Kubewarden')
  await expect(page.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()

  await expect(page.getByRole('link', { name: 'Create Policy Server' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create Admission Policy' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create Cluster Admission Policy' })).toBeVisible()

  await expect(page.getByText('Active 6 of 6 Global Policies / 100%')).toBeVisible({timeout:60_000})
  await expect(page.getByText('Active 0 of 0 Namespaced Policies / 0%')).toBeVisible()

  await ui.withReload(async () => {
    expect(page.getByText('Active 1 of 1 Pods / 100%')).toBeVisible()
  }, 'https://github.com/rancher/kubewarden-ui/issues/514')
});

test('Policy Servers Landing Page', async({ page, ui, nav }) => {
  await nav.explorer('Kubewarden', 'PolicyServers')
  await expect(page.getByRole('heading', { name: 'PolicyServers' })).toBeVisible()

  // Default policy server
  const psRow = ui.getRow('default')
  await expect(psRow.row).toBeVisible()
  await expect(psRow.column('Status')).toHaveText('Active')
  await expect(psRow.column('Policies')).toHaveText('6')

  // Check there is only default policy server
  await expect(page.locator('td.col-policy-server-status')).toHaveCount(1);
});

test('Cluster Admission Policies Landing page', async({ page, nav }) => {
  await nav.explorer('Kubewarden', 'ClusterAdmissionPolicies')

  await expect(page.getByRole('heading', { name: 'ClusterAdmissionPolicies' })).toBeVisible()
  await expect(page.locator('.col-policy-status')).toHaveCount(6);
  await expect(page.locator('.col-policy-status').getByText('Active')).toHaveCount(6);
  await expect(page.locator('.col-link-detail').first()).not.toBeEmpty();
});

test('Admission Policies Landing page', async({ page, nav }) => {
  await nav.explorer('Kubewarden', 'AdmissionPolicies')

  await expect(page.getByRole('heading', { name: 'AdmissionPolicies' })).toBeVisible()
  await expect(page.getByText('There are no rows to show.')).toBeVisible()
});
