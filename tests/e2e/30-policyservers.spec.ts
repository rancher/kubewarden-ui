import semver from 'semver'
import { test, expect } from './rancher/rancher-test'
import { PolicyServersPage, PolicyServer } from './pages/policyservers.page'
import { Policy, AdmissionPoliciesPage, ClusterAdmissionPoliciesPage } from './pages/policies.page'

const expect3m = expect.configure({ timeout: 3 * 60_000 })
const UPGRADE = !!process.env.UPGRADE && process.env.UPGRADE !== 'false'

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
    await nav.pserver()
    await expect3m(psRow.column('Status')).toHaveText('Active')
    await expect(psRow.column('Policies')).toHaveText('2')

    const defaultImage = (await ui.tableRow('default').column('Image').textContent())?.trim().split(':') || []
    const createdImage = (await psRow.column('Image').textContent())?.trim().split(':') || []
    const [dImg, dVer] = [defaultImage[0], semver.parse(defaultImage[1])]
    const [cImg, cVer] = [createdImage[0], semver.parse(createdImage[1])]

    // Validate parsed text is not empty
    expect(cVer, `Invalid semver: ${cVer}`).not.toBeNull()
    expect(dVer, `Invalid semver: ${dVer}`).not.toBeNull()
    if (!cVer || !dVer || !cImg || !dImg) throw new Error('Should not happen')

    // Validate image URLs
    expect(cImg).toEqual(dImg)
    expect(cImg).toContain('policy-server')

    // Created PS should use released version
    expect(cVer.prerelease.length).toBe(0)

    // Default PS could be updated to latest rc
    if (UPGRADE && dVer.prerelease.length > 0) {
      expect(semver.lt(cVer, dVer)).toBeTruthy()
    // } else {
      // expect(semver.eq(cVer, dVer)).toBeTruthy()
    }
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
