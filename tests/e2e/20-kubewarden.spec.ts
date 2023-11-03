import { test, expect } from './rancher-test';
import { PolicyServersPage } from './pages/policyservers.page';
import { Policy, AdmissionPoliciesPage, ClusterAdmissionPoliciesPage } from './pages/policies.page';
import { KubewardenPage } from './pages/kubewarden.page';

const expect2m = expect.configure({timeout: 2*60_000})

// Increase count and remove % because it changes 0% -> 100%
function statsPlusOne(stats: string): string {
  const parts = stats.trim().split(' ', 3)
  let m = parseInt(parts[0], 10) + 1
  let n = parseInt(parts[2], 10) + 1
  return stats.replace(/\d+ of \d+/, `${m} of ${n}`).replace(/\d+%$/, '')
}

test('Stats reflect resource changes', async({ page, nav }) => {
  const kwPage = new KubewardenPage(page)
  const psPage = new PolicyServersPage(page)
  const apPage = new AdmissionPoliciesPage(page)
  const capPage = new ClusterAdmissionPoliciesPage(page)

  const ps = {name: 'kw-policyserver'}
  const policy: Policy = {title: 'Pod Privileged Policy', name: 'kw-policy-privpod', server: ps.name }

  await nav.explorer('Kubewarden')
  const psStats = await kwPage.getStats('Policy Servers').textContent() || 'Empty'
  const apStats = await kwPage.getStats('Admission Policies').textContent() || 'Empty'
  const capStats = await kwPage.getStats('Cluster Admission Policies').textContent() || 'Empty'

  await test.step('Policy Server stats', async () => {
    await kwPage.createPsBtn.click()
    await psPage.create(ps, {navigate: false})
    await nav.explorer('Kubewarden')
    await expect2m(kwPage.getStats('Policy Servers').getByText(statsPlusOne(psStats))).toBeVisible()
  })

  await test.step('Admission Policies stats', async () => {
    await kwPage.createApBtn.click()
    await apPage.create(policy, {navigate: false})
    await nav.explorer('Kubewarden')
    await expect2m(kwPage.getStats('Admission Policies').getByText(statsPlusOne(apStats))).toBeVisible()
  })

  await test.step('Cluster Admission Policies stats', async () => {
    await kwPage.createCapBtn.click()
    await capPage.create(policy, {navigate: false})
    await nav.explorer('Kubewarden')
    await expect2m(kwPage.getStats('Cluster Admission Policies').getByText(statsPlusOne(capStats))).toBeVisible()
  })

  await test.step('Stats after deleting resources ', async () => {
    await psPage.delete(ps.name)
    await nav.explorer('Kubewarden')
    await expect2m(kwPage.getStats('Policy Servers').getByText(psStats)).toBeVisible()
    await expect2m(kwPage.getStats('Admission Policies').getByText(apStats)).toBeVisible()
    await expect2m(kwPage.getStats('Cluster Admission Policies').getByText(capStats)).toBeVisible()
  })

});
