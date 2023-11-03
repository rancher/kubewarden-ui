import { test, expect } from './rancher-test';
import { PolicyServersPage } from './pages/policyservers.page';
import { Policy, AdmissionPoliciesPage, ClusterAdmissionPoliciesPage } from './pages/policies.page';
import { PolicyServer } from './pages/policyservers.page';

const expect3m = expect.configure({timeout: 3*60_000})

test('Policy Servers', async({ page, ui }) => {
  const server: PolicyServer = { name: 'test-policyserver' }
  const policy: Policy = {title: 'Pod Privileged Policy', name: 'test-policy-podpriv', server: server.name}

  const psPage = new PolicyServersPage(page)
  const apPage = new AdmissionPoliciesPage(page)
  const capPage = new ClusterAdmissionPoliciesPage(page)

  // Create policy server
  await psPage.create(server)
  // Create 1 Admission, 1 ClusterAdmission policy
  await apPage.create(policy)
  await capPage.create(policy)

  // Check Policy Server overview page
  await psPage.goto()
  const psRow = ui.getRow(server.name)
  // PS is active and has 2 policies
  await expect3m(psRow.column('Status')).toHaveText('Active')
  await expect(psRow.column('Policies')).toHaveText('2')
  // PS image is the same as default one
  const defaultImage = await ui.getRow('default').column('Image').textContent() || 'Empty'
  await expect(psRow.column('Image')).toHaveText(defaultImage)

  // Check Policy Server details page
  await psRow.open()
  const apRow = ui.getRow(policy.name, {group: 'AdmissionPolicy'})
  const capRow = ui.getRow(policy.name, {group: 'ClusterAdmissionPolicy'})
  await expect3m(apRow.column('Status')).toHaveText('Active')
  await expect3m(capRow.column('Status')).toHaveText('Active')

  // Delete and check policies are also deleted
  await psPage.delete(psRow)
  await apPage.goto()
  await expect(page.locator('table.sortable-table')).toBeVisible()
  await expect(apRow.row).not.toBeVisible()
  await capPage.goto()
  await expect(page.locator('table.sortable-table')).toBeVisible()
  await expect(capRow.row).not.toBeVisible()
});
