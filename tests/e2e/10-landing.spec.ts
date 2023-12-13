import { test, expect } from './rancher-test'

const expect1m = expect.configure({ timeout: 60_000 })

test('Brief check of landing pages', async({ page, ui, nav }) => {
  await test.step('Kubewarden Landing page', async() => {
    await nav.explorer('Kubewarden')
    // Header contains version
    await expect(page.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()
    // Recommended policies stats
    await expect1m(page.getByText('Active 1 of 1 Pods / 100%')).toBeVisible()
    await expect1m(page.getByText('Active 0 of 0 Namespaced Policies / 0%')).toBeVisible()
    await expect1m(page.getByText('Active 6 of 6 Global Policies / 100%')).toBeVisible()
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
