import { test, expect } from './rancher/rancher-test'
import { PolicyServersPage } from './pages/policyservers.page'
import { Policy, AdmissionPoliciesPage, ClusterAdmissionPoliciesPage } from './pages/policies.page'
import { KubewardenPage } from './pages/kubewarden.page'
import { RancherAppsPage } from './rancher/rancher-apps.page'

test('Check kubewarden resources', async({ page, nav, shell }) => {
  await test.step('Check kubewarden apps', async() => {
    const apps = new RancherAppsPage(page)
    await nav.explorer('Apps', 'Installed Apps')
    for (const chart of ['controller', 'crds', 'defaults']) {
      await apps.checkChart(`rancher-kubewarden-${chart}`)
    }
    await shell.waitPods()
  })

  await test.step('Check kubewarden logs', async() => {
    await nav.cluster()

    // Kubewarden pod labels
    const labels = [
      'app=kubewarden-policy-server-default',
      'app.kubernetes.io/name=kubewarden-controller',
      'app.kubernetes.io/name=policy-reporter',
      'app.kubernetes.io/name=ui']

    // Ignore known errors
    const ignore = [
      'Reconciler.*object has been modified',
      // 'policy_server:.*(TufError|Sigstore)', // Fix in https://github.com/kubewarden/kwctl/issues/753
    ].join('|')

    // Check for ERROR text in logs
    await shell.runBatch(...labels.map(
      label => `k logs -n cattle-kubewarden-system -l '${label}' --tail -1
     | grep ERROR | grep -vE '${ignore}'
     | tee /dev/stderr | wc -l | grep -x 0`))
  })
})

test('Check landing pages', async({ page, ui, nav }) => {
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
