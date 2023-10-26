import { test, expect } from './rancher-test';
import { PolicyServer, PolicyServersPage } from './pages/policyservers.page';
import { ClusterAdmissionPoliciesPage } from './pages/clusteradmissionpolicies.page';
import { Policy } from './pages/basepolicypage';
import { TableRow } from './components/table-row';

test('ClusterAdmissionPolicies ', async({ page, ui }) => {
  let row: TableRow
  const capPage = new ClusterAdmissionPoliciesPage(page)
  const finishBtn = ui.button('Finish')

  await test.step('Creation without required fields', async () => {
    const p: Policy = {title: 'Pod Privileged Policy', name: 'test-policy-podpriv'}

    await capPage.goto()
    await capPage.open(p)
    // Try to create without name
    await capPage.setName('')
    await finishBtn.click()
    await expect(page.locator('div.error').getByText('Required value: name')).toBeVisible()
    await finishBtn.waitFor({timeout: 10_000}) // button name changes back Error -> Finish
    // Try without module
    await capPage.setValues(p)
    await capPage.setModule('')
    await expect(finishBtn).not.toBeEnabled()
  })

  await test.step('Try monitor & protect mode', async () => {
    // Create in protect
    row = await capPage.create({title: 'Pod Privileged Policy', name: 'test-policy-mode-protect', mode: 'Protect'}, {wait: true})
    await expect(row.column('Mode')).toHaveText('Protect')
    await row.delete()

    // Create in monitor, change to protect, can't change back
    row = await capPage.create({title: 'Pod Privileged Policy', name: 'test-policy-mode-monitor', mode: 'Monitor'}, {wait: true})
    await expect(row.column('Mode')).toHaveText('Monitor')
    await capPage.updateToProtect(row)
    await expect(row.column('Mode')).toHaveText('Protect')
    await row.delete()
  })

  await test.step('Try default & custom policy server', async () => {
    let ps: PolicyServer = {name: 'test-cap-custom-ps' }

    // Create custom policy server
    const psPage = new PolicyServersPage(page)
    await psPage.create(ps)

    // Create policy with custom PS
    row = await capPage.create({title: 'Pod Privileged Policy', name: 'test-policy-custom-ps', server: ps.name})
    await expect(row.column('Policy Server')).toHaveText(ps.name)
    // Delete custom PS, check policy is deleted too
    await psPage.delete(ps.name)
    await capPage.goto()
    await expect(row.row).not.toBeVisible()

    // Create policy with default PS
    row = await capPage.create({title: 'Pod Privileged Policy', name: 'test-policy-default-ps'})
    await expect(row.column('Policy Server')).toHaveText('default')
    // Check details page
    await row.open()
    await expect(page.getByText('ClusterAdmissionPolicy: test-policy-default-ps')).toBeVisible()
    await expect(page.getByText('API Versions')).toBeVisible()
    // Check config page
    await page.locator('div.actions-container').getByRole('button', {name: 'Config', exact: true}).click()
    await expect(ui.input('Name*')).toHaveValue('test-policy-default-ps')
    await capPage.delete(row)
  })

  await test.step('Try Rules can\'t be edited', async () => {
    await capPage.open({title:'Pod Privileged Policy', name: ''})
    await capPage.selectTab('Rules')
    await expect(page.locator('section#rules').locator('input').first()).toBeDisabled()
  })

});
