import { test, expect } from './rancher/rancher-test'
import { PolicyServersPage } from './pages/policyservers.page'
import { Policy, AdmissionPoliciesPage, ClusterAdmissionPoliciesPage } from './pages/policies.page'
import { KubewardenPage } from './pages/kubewarden.page'

const expect2m = expect.configure({ timeout: 2 * 60_000 })

// Increase count and remove % because it changes 0% -> 100%
function statsPlusOne(stats: string): string {
  const parts = stats.trim().split(' ', 3)
  const m = parseInt(parts[0], 10) + 1
  const n = parseInt(parts[2], 10) + 1
  return stats.replace(/\d+ of \d+/, `${m} of ${n}`).replace(/\d+%$/, '')
}

test('Stats reflect resource changes', async({ page, nav }) => {
  const kwPage = new KubewardenPage(page)
  const psPage = new PolicyServersPage(page)
  const apPage = new AdmissionPoliciesPage(page)
  const capPage = new ClusterAdmissionPoliciesPage(page)

  const ps = { name: 'kw-policyserver' }
  const policy: Policy = { title: 'Pod Privileged Policy', name: 'kw-policy-privpod', server: ps.name }

  // Get initial counts
  await nav.explorer('Kubewarden')
  const psCount = await kwPage.getCount('Policy Servers').textContent() || 'Empty'
  const psStats = await kwPage.getStats('Policy Servers').textContent() || 'Empty'
  const apCount = await kwPage.getCount('Namespaced Policies').textContent() || 'Empty'
  const capCount = await kwPage.getCount('Cluster Policies').textContent() || 'Empty'

  await test.step('Policy Server counter++', async() => {
    await kwPage.createPsBtn.click()
    await psPage.create(ps, { navigate: false })
    await nav.explorer('Kubewarden')
    await expect(kwPage.getCount('Policy Servers')).toHaveText((+psCount + 1).toString())
    await expect2m(kwPage.getStats('Policy Servers').getByText(statsPlusOne(psStats))).toBeVisible()
  })

  await test.step('Namespaced Policy counter++', async() => {
    await kwPage.createApBtn.click()
    await apPage.create(policy, { navigate: false })
    await nav.explorer('Kubewarden')
    await expect(kwPage.getCount('Namespaced Policies')).toHaveText((+apCount + 1).toString())
  })

  await test.step('Cluster Policy counter++', async() => {
    await kwPage.createCapBtn.click()
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
    await expect2m(kwPage.getStats('Policy Servers').getByText(psStats)).toBeVisible()
  })
})
