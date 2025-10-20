import semver from 'semver'
import { test, expect } from './rancher/rancher-test'
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
    // PS is active and has 2 policies
    await nav.pservers()
    await expect3m(psRow.column('Status')).toHaveText('Active')
    await expect(psRow.column('Policy Status')).toHaveText('2')

    const defaultImage = (await ui.tableRow('default').column('Image').textContent())?.trim().split(':') || []
    const createdImage = (await psRow.column('Image').textContent())?.trim().split(':') || []
    const [dImg, dVer] = [defaultImage[0], defaultImage[1]]
    const [cImg, cVer] = [createdImage[0], createdImage[1]]

    // Validate URLs
    expect(cImg).toEqual(dImg)
    expect(cImg).toContain('policy-server')

    // Validate semver
    expect(semver.valid(cVer)).not.toBeNull()
    expect(semver.valid(dVer)).not.toBeNull()

    // Validate version is equal to default
    expect(semver.eq(cVer, dVer)).toBeTruthy()
  })

  await test.step('Check Details page', async() => {
    await psRow.open()
    await expect3m(apRow.column('Status')).toHaveText('Active')
    await expect3m(capRow.column('Status')).toHaveText('Active')
  })

  await test.step('Scale policy server', async() => {
    await nav.pservers()
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

test('Create with invalid values', async({ page, ui, nav }) => {
  const psPage = new PolicyServersPage(page)

  await nav.pservers()
  await ui.button('Create').click()
  await psPage.setName('in valid')
  await ui.button('Create').click()
  await expect(page.locator('#cru-errors').getByText('Invalid value: "in valid"')).toBeVisible()
})

test('Create with custom values', async({ page, ui, nav }) => {
  const psPage = new PolicyServersPage(page)
  const ps = { name: 'test-policyserver', image: 'ghcr.io/kubewarden/policy-server:latest', replicas: 2 }
  await psPage.create(ps, { wait: false })

  await nav.pservers(ps.name)
  await ui.showConfiguration()
  await expect(ui.input('Name*')).toHaveValue(ps.name)
  await expect(ui.input('Image URL')).toHaveValue(ps.image)
  await expect(ui.input('Replicas*')).toHaveValue(ps.replicas.toString())
  await ui.hideConfiguration()

  await psPage.delete(ps.name)
})
