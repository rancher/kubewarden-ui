import { test, expect } from './rancher/rancher-test'
import { PolicyServersPage } from './pages/policyservers.page'
import { Policy, AdmissionPoliciesPage, ClusterAdmissionPoliciesPage } from './pages/policies.page'
import { KubewardenPage } from './pages/kubewarden.page'

test('Check initial state', async({ page, ui, nav }) => {
  await test.step('Kubewarden Landing page', async() => {
    const kwPage = new KubewardenPage(page)

    await nav.kubewarden()
    // Header contains version
    const head = page.locator('div.head')
    await expect(head.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()
    await expect(head.getByText(/App Version:\s+v[1-9][0-9.]+[0-9]/)).toBeVisible()

    // Recommended policies stats
    await expect(kwPage.getStats('Namespaced Policies')).toHaveText('No policies available.')
    await expect(kwPage.getStats('Cluster Policies')).toHaveText('0 protect+6 monitor')
    await expect(kwPage.getStats('Policy Servers')).toContainText('0 protect + 6 monitor')
    expect(await kwPage.getCount('Policy Servers')).toBe(1)
  })

  await test.step('Policy Servers Landing Page', async() => {
    await nav.pservers()
    await expect(page.getByRole('heading', { name: 'Policy Servers' })).toBeVisible()

    // Default policy server
    const psRow = ui.tableRow('default')
    await expect(psRow.row).toBeVisible()
    await expect(psRow.column('Status')).toHaveText('Active')
    await expect(psRow.column('Policy Status')).toHaveText('6')

    // Check there is only default policy server
    await expect(page.locator('td.col-policy-server-status')).toHaveCount(1)
  })

  await test.step('Admission Policies Landing page', async() => {
    await nav.apolicies()

    await expect(page.getByRole('heading', { name: 'Admission Policies' })).toBeVisible()
    await expect(page.getByText('There are no rows to show.')).toBeVisible()
  })

  await test.step('Cluster Admission Policies Landing page', async() => {
    await nav.capolicies()

    await expect(page.getByRole('heading', { name: 'Cluster Admission Policies' })).toBeVisible()
    await expect(page.locator('.col-policy-status')).toHaveCount(6)
    await expect(page.locator('.col-policy-status').getByText('Active')).toHaveCount(6)
    await expect(page.locator('.col-link-detail').first()).not.toBeEmpty()
  })
})

test('Stats reflect resource changes', async({ page, nav }) => {
  const kwPage = new KubewardenPage(page)
  const psPage = new PolicyServersPage(page)
  const apPage = new AdmissionPoliciesPage(page)
  const capPage = new ClusterAdmissionPoliciesPage(page)

  const ps = { name: 'kw-policyserver' }
  const policy: Policy = { title: 'Pod Privileged Policy', name: 'kw-policy-privpod', server: ps.name }

  // Get initial counts
  await nav.kubewarden()
  const apCount = await kwPage.getCount('Namespaced Policies')
  const capCount = await kwPage.getCount('Cluster Policies', { mode: 'protect' })

  await test.step('Add Policy Server', async() => {
    await psPage.create(ps)
    await nav.kubewarden()
    await expect(kwPage.getPolicyServer(ps.name)).toContainText('0 protect + 0 monitor')
  })

  await test.step('Add Namespaced Policy', async() => {
    await kwPage.getPane('Namespaced Policies').getByRole('link', { name: 'Add policy' }).click()
    await apPage.create(policy, { navigate: false })
    await nav.kubewarden()
    await expect(kwPage.getStats('Namespaced Policies')).toHaveText((+apCount + 1).toString() + ' protect+0 monitor')
    await expect(kwPage.getPolicyServer(ps.name)).toContainText('1 protect + 0 monitor')
  })

  await test.step('Add Cluster Policy', async() => {
    await capPage.create(policy)
    await nav.kubewarden()
    await expect(kwPage.getStats('Cluster Policies')).toHaveText((+capCount + 1).toString() + ' protect+6 monitor')
    await expect(kwPage.getPolicyServer(ps.name)).toContainText('2 protect + 0 monitor')
  })

  await test.step('Stats after deleting resources ', async() => {
    await psPage.delete(ps.name)
    await nav.kubewarden()
    await expect(kwPage.getStats('Namespaced Policies')).toHaveText('No policies available.')
    await expect(kwPage.getStats('Cluster Policies')).toHaveText('0 protect+6 monitor')
    await expect(kwPage.getPolicyServer(ps.name)).not.toBeVisible()
  })
})
