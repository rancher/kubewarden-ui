import { test, expect } from './rancher-test'
import { PolicyServersPage, PolicyServer } from './pages/policyservers.page'
import { Policy, AdmissionPoliciesPage, ClusterAdmissionPoliciesPage } from './pages/policies.page'

const expect3m = expect.configure({ timeout: 3 * 60_000 })

test('Policy Servers', async({ page, ui, nav }) => {
  const server: PolicyServer = { name: 'test-policyserver' }
  const policy: Policy = { title: 'Pod Privileged Policy', name: 'test-policy-podpriv', server: server.name }

  const psPage = new PolicyServersPage(page)
  const apPage = new AdmissionPoliciesPage(page)
  const capPage = new ClusterAdmissionPoliciesPage(page)

  const psRow = ui.tableRow(server.name)
  const apRow = ui.tableRow(policy.name, { group: 'AdmissionPolicy' })
  const capRow = ui.tableRow(policy.name, { group: 'ClusterAdmissionPolicy' })

  await test.step('Create resources', async() => {
    await psPage.create(server)
    await apPage.create(policy)
    await capPage.create(policy)
  })

  await test.step('Check Overview page', async() => {
    await nav.pserver()
    // PS is active and has 2 policies
    await expect3m(psRow.column('Status')).toHaveText('Active')
    await expect(psRow.column('Policies')).toHaveText('2')
    // PS image is the same as default one
    const defaultImage = await ui.tableRow('default').column('Image').textContent() || 'Empty'
    await expect(psRow.column('Image')).toHaveText(defaultImage)
  })

  await test.step('Check Details page', async() => {
    await psRow.open()
    await expect3m(apRow.column('Status')).toHaveText('Active')
    await expect3m(capRow.column('Status')).toHaveText('Active')
  })

  await test.step('Scale policy server', async() => {
    await nav.pserver()
    await psRow.action('Edit Config')
    await psPage.setReplicas(2)
    await ui.button('Save').click()
    await psRow.toHaveState('Updating')
    await psRow.toHaveState('Active')
  })

  await test.step('Delete policy server', async() => {
    await psRow.delete()
    await apPage.goto()
    await expect(page.locator('table.sortable-table')).toBeVisible()
    await expect(apRow.row).not.toBeVisible()
    await capPage.goto()
    await expect(page.locator('table.sortable-table')).toBeVisible()
    await expect(capRow.row).not.toBeVisible()
  })
})
