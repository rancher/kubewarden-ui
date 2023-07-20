import { test, expect } from './rancher-test';
import { PolicyServersPage } from './pages/policyservers.page';
import { ClusterAdmissionPoliciesPage } from './pages/clusteradmissionpolicies.page';
import { Policy } from './pages/basepolicypage';
import { TableRow } from './components/table-row';

test('ClusterAdmissionPolicies ', async({ page, ui }) => {
  const pName = 'test-policy-podpriv'
  const p: Policy = {title: 'Pod Privileged Policy'}

  const capPage = new ClusterAdmissionPoliciesPage(page)

  const finishBtn = page.getByRole('button', { name: 'Finish', exact: true })
  let row: TableRow

  // ====================================================================================
  // Creation without required fields
  await capPage.goto()
  await capPage.open(p)
  // Try to create without name
  await capPage.setName('')
  await finishBtn.click()
  await expect(page.locator('div.error').getByText('Required value: name')).toBeVisible()
  await finishBtn.waitFor({timeout: 10_000}) // button name changes back Error -> Finish
  // Try without module
  await capPage.setValues({title: p.title, name: pName, module: ''})
  await expect(finishBtn).not.toBeEnabled()

  // ====================================================================================
  // Try monitor & protect mode
  await capPage.goto()
  // Create in protect
  row = await capPage.create({title: p.title, name: 'test-policy-mode-protect', mode: 'Protect'}, {wait: true})
  await expect(row.column('Mode')).toHaveText('Protect')
  await row.delete()
  // Create in monitor, change to protect, can't change back
  row = await capPage.create({title: p.title, name: 'test-policy-mode-monitor', mode: 'Monitor'}, {wait: true})

  await expect(row.column('Mode')).toHaveText('Monitor')
  await capPage.updateToProtect(row)
  await expect(row.column('Mode')).toHaveText('Protect')
  await row.delete()

  // ====================================================================================
  // Try default & custom policy server

  let customPS = 'test-cap-custom-ps'

  // Create custom policy server
  const psPage = new PolicyServersPage(page)
  await psPage.goto()
  await psPage.create(customPS, {wait: true})

  // Create policy with custom PS
  await capPage.goto()
  row = await capPage.create({title: p.title, name: 'test-policy-custom-ps', server: customPS})
  await expect(row.column('Policy Server')).toHaveText(customPS)
  // Delete custom PS, check policy is deleted too
  await psPage.goto()
  await psPage.delete(customPS)
  await capPage.goto()
  await expect(row.row).not.toBeVisible()

  // Create policy with default PS
  await capPage.goto()
  row = await capPage.create({title: p.title, name: 'test-policy-default-ps'})
  await expect(row.column('Policy Server')).toHaveText('default')
  // Check details page
  await row.open()
  await expect(page.getByText('ClusterAdmissionPolicy: test-policy-default-ps')).toBeVisible()
  await expect(page.getByText('API Versions')).toBeVisible()
  // Check config page
  await page.locator('div.actions-container').getByRole('button', {name: 'Config', exact: true}).click()
  await expect(ui.input('Name*')).toHaveValue('test-policy-default-ps')
  await capPage.goto()
  await row.delete()

  // ====================================================================================
  // Rules can't be edited
  await capPage.goto()
  await capPage.open({title:'Pod Privileged Policy'})
  await capPage.selectTab('Rules')
  await expect(page.locator('section#rules').locator('input').first()).toBeDisabled()
});
