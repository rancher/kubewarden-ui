import { test, expect } from './rancher/rancher-test'
import { PolicyServersPage } from './pages/policyservers.page'
import { Policy, AdmissionPoliciesPage, ClusterAdmissionPoliciesPage } from './pages/policies.page'
import { KubewardenPage } from './pages/kubewarden.page'

test('Check initial state', async({ page, ui, nav }) => {
  await test.step('Kubewarden Landing page', async() => {
    const kwPage = new KubewardenPage(page)

    await nav.explorer('Kubewarden')
    // Header contains version
    const head = page.locator('div.head')
    await expect(head.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()
    await expect(head.getByText(/App Version:\s+v[1-9][0-9.]+[0-9]/)).toBeVisible()

    // Recommended policies stats
    await expect(kwPage.getCount(('Namespaced Policies'))).toHaveText('0')
    await expect(kwPage.getCount(('Cluster Policies'))).toHaveText('6')
    await expect(kwPage.getCount(('Policy Servers'))).toHaveText('1')
    await expect(kwPage.getPolicyServer('default')).toContainText('6 Monitor / 0 Protect')
  })

  await test.step('Policy Servers Landing Page', async() => {
    await nav.explorer('Kubewarden', 'PolicyServers')
    await expect(page.getByRole('heading', { name: 'PolicyServers' })).toBeVisible()

    // Default policy server
    const psRow = ui.tableRow('default')
    await expect(psRow.row).toBeVisible()
    await expect(psRow.column('Status')).toHaveText('Active')
    await expect(psRow.column('Policies')).toHaveText('6')

    // Check there is only default policy server
    await expect(page.locator('td.col-policy-server-status')).toHaveCount(1)
  })

  await test.step('Admission Policies Landing page', async() => {
    await nav.explorer('Kubewarden', 'AdmissionPolicies')

    await expect(page.getByRole('heading', { name: 'AdmissionPolicies' })).toBeVisible()
    await expect(page.getByText('There are no rows to show.')).toBeVisible()
  })

  await test.step('Cluster Admission Policies Landing page', async() => {
    await nav.explorer('Kubewarden', 'ClusterAdmissionPolicies')

    await expect(page.getByRole('heading', { name: 'ClusterAdmissionPolicies' })).toBeVisible()
    await expect(page.locator('.col-policy-status')).toHaveCount(6)
    await expect(page.locator('.col-policy-status').getByText('Active')).toHaveCount(6)
    await expect(page.locator('.col-link-detail').first()).not.toBeEmpty()
  })
})

test('Stats reflect resource changes', async({ ui, page, nav }) => {
  const expect2m = expect.configure({ timeout: 2 * 60_000 })

  const kwPage = new KubewardenPage(page)
  const psPage = new PolicyServersPage(page)
  const apPage = new AdmissionPoliciesPage(page)
  const capPage = new ClusterAdmissionPoliciesPage(page)

  const ps = { name: 'kw-policyserver' }
  const policy: Policy = { title: 'Pod Privileged Policy', name: 'kw-policy-privpod', server: ps.name }

  // Get initial counts
  await nav.explorer('Kubewarden')
  const psCount = await kwPage.getCount('Policy Servers').textContent() || 'Empty'
  const apCount = await kwPage.getCount('Namespaced Policies').textContent() || 'Empty'
  const capCount = await kwPage.getCount('Cluster Policies').textContent() || 'Empty'

  await test.step('Policy Server counter++', async() => {
    await page.getByRole('heading', { name: 'Policy Servers' }).click()
    await ui.button('Create').click()
    await psPage.create(ps, { navigate: false })
    await nav.explorer('Kubewarden')
    await expect(kwPage.getCount('Policy Servers')).toHaveText((+psCount + 1).toString())
    await expect(kwPage.getPolicyServer(ps.name)).toContainText('0 Monitor / 0 Protect')
  })

  await test.step('Namespaced Policy counter++', async() => {
    await page.getByRole('heading', { name: 'Namespaced Policies' }).click()
    await ui.button('Create').click()
    await apPage.create(policy, { navigate: false })
    await nav.explorer('Kubewarden')
    await expect(kwPage.getCount('Namespaced Policies')).toHaveText((+apCount + 1).toString())
  })

  await test.step('Cluster Policy counter++', async() => {
    await page.getByRole('heading', { name: 'Cluster Policies' }).click()
    await ui.button('Create').click()
    await capPage.create(policy, { navigate: false })
    await nav.explorer('Kubewarden')
    await expect(kwPage.getCount('Cluster Policies')).toHaveText((+capCount + 1).toString())
  })

  await test.step('Stats after deleting resources ', async() => {
    await psPage.delete(ps.name)
    await nav.explorer('Kubewarden')
    await expect(kwPage.getCount('Namespaced Policies')).toHaveText(apCount)
    await expect(kwPage.getCount('Cluster Policies')).toHaveText(capCount)
    await expect(kwPage.getCount('Policy Servers')).toHaveText(psCount)
  })
})
