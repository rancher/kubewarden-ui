import { test, expect } from './rancher/rancher-test'
import { PolicyServer, PolicyServersPage } from './pages/policyservers.page'
import { AdmissionPoliciesPage, ClusterAdmissionPoliciesPage, BasePolicyPage, Policy } from './pages/policies.page'
import { RancherUI } from './components/rancher-ui'
import { RancherAppsPage } from './rancher/rancher-apps.page'

const MODE = process.env.MODE || 'base'

function isAP(polPage: BasePolicyPage) { return polPage instanceof AdmissionPoliciesPage }
function isCAP(polPage: BasePolicyPage) { return polPage instanceof ClusterAdmissionPoliciesPage }

const pMinimal: Policy = {
  title: 'Pod Privileged Policy',
  name :  'ppp-defaults',
}

async function checkPolicy(p: Policy, polPage: BasePolicyPage, ui: RancherUI) {
  // Check default values if unset
  const mode = p.mode ?? 'Protect'
  const audit = p.audit ?? 'On'
  const server = p.server ?? 'default'
  const namespace = p.namespace ?? 'default'
  const module = p.module ?? ''
  const row = ui.tableRow(p.name)

  await test.step(`Check overview page: ${p.name}`, async() => {
    await polPage.goto()
    await expect(row.column('Mode')).toHaveText(mode)
    await expect(row.column('Policy Server')).toHaveText(server)
    test.info().annotations.push({ type: 'Feature', description: 'Policy title (module) should be visible' })
    test.info().annotations.push({ type: 'Feature', description: 'AdmissionPolicy namespace should be visible on overview page' })
  })

  await test.step(`Check details page: ${p.name}`, async() => {
    await row.open()
    await expect(ui.page.getByText(new RegExp(`^\\s+${polPage.kind}:\\s+${p.name}`))).toBeVisible()
    await expect(ui.page.getByText('API Versions')).toBeVisible()
  })

  await test.step(`Check config page: ${p.name}`, async() => {
    await ui.button('Config').click()
    await expect(polPage.name).toHaveValue(p.name)
    if (p.title === 'Custom Policy') await expect(polPage.module).toHaveValue(module)
    await expect(polPage.mode(mode)).toBeChecked()
    await expect(polPage.audit(audit)).toBeChecked()
    await expect(polPage.server).toContainText(server)
    if (isAP(polPage)) {
      await expect(polPage.namespace).toContainText(namespace)
    }
  })

  await test.step(`Check edit config: ${p.name}`, async() => {
    await polPage.goto()
    await row.action('Edit Config')
    await expect(polPage.name).toBeDisabled()
    if (p.title === 'Custom Policy') await expect(polPage.module).toBeEnabled()
    await expect(polPage.modeGroup).toBeAllEnabled({ enabled: p.mode === 'Monitor' })
    await expect(polPage.auditGroup).toBeAllEnabled()
    await expect(polPage.server).toBeAllEnabled({ enabled: false })
    if (isAP(polPage)) {
      await expect(polPage.namespace).toBeAllEnabled({ enabled: false })
    }
  })

  // Check policy is active
  await expect(ui.page.locator('div.primaryheader').locator('span.badge-state')).toHaveText('Active', { timeout: 2 * 60_000 })
}

const pageTypes = [AdmissionPoliciesPage, ClusterAdmissionPoliciesPage]

for (const PolicyPage of pageTypes) {
  const abbrName = PolicyPage.name.replace('Page', '').match(/[A-Z]/g)?.join('')

  test(`Form fields (${abbrName})`, async({ page, ui }) => {
    const polPage = new PolicyPage(page)
    const p: Policy = { title: 'Pod Privileged Policy', name: '' }

    await test.step('Missing required fields', async() => {
      const finishBtn = ui.button('Finish')
      await polPage.open(p)

      // Create without name
      await polPage.setName('')
      await finishBtn.click()
      await expect(page.locator('div.error').getByText('Required value: name')).toBeVisible()
      await finishBtn.waitFor({ timeout: 10_000 }) // button name changes back Error -> Finish
      await polPage.setName('name')
    })

    await test.step('Readme is visible', async() => {
      await ui.button('Show Readme').click()
      await expect(polPage.readme).toBeInViewport()
      await expect(polPage.readme).toContainText(p.title)
      await ui.button(/^Close/).click()
      await expect(polPage.readme).not.toBeInViewport()
    })

    await test.step('Policy specific fields A/CA', async() => {
      // Open page and wait for the form
      await polPage.open(p)
      await expect(polPage.name).toBeVisible()
      // Check fields based on policy type
      await expect(polPage.namespace).toBeVisible({ visible: isAP(polPage) })
      await expect(ui.tab('Namespace Selector')).toBeVisible({ visible: isCAP(polPage) })
    })

    await test.step('Rules are disabled', async() => {
      await polPage.open(p)
      await polPage.selectTab('Rules')
      await expect(page.locator('section#rules')).toBeAllEnabled({ enabled: false })
    })
  })

  test(`Default policy settings (${abbrName})`, async({ page, ui }) => {
    const polPage = new PolicyPage(page)
    const row = await polPage.create(pMinimal)
    await checkPolicy(pMinimal, polPage, ui)
    await polPage.delete(row)
  })

  test(`Modified policy settings (${abbrName})`, async({ page, ui, shell }) => {
    const polPage = new PolicyPage(page)
    const ps: PolicyServer = { name: 'ps-custom' }
    const p: Policy = { ...pMinimal, mode: 'Monitor', audit: 'Off', server: ps.name }

    if (isAP(polPage)) p.namespace = 'ns-custom'

    // Create custom server
    const psPage = new PolicyServersPage(page)
    await psPage.create(ps)

    // Create and check policy
    const row = await polPage.create(p)
    await checkPolicy(p, polPage, ui)
    await shell.privpod({ ns: p.namespace })

    // Update to Protect mode
    await polPage.goto()
    await polPage.updateToProtect(row)
    // Check protect mode
    test.info().annotations.push({ type: 'BUG', description: 'Policy should be pending (mode or state) until it starts in protect mode' })
    await shell.waitPolicyState(p, polPage.kind)
    await shell.privpod({ ns: p.namespace, status: 1 })

    // Delete custom PS & NS, policy is deleted too
    await psPage.delete(ps.name)
    await polPage.goto()
    await expect(page.getByRole('cell', { name: 'Status' })).toBeVisible()
    await expect(row.row).not.toBeVisible()
    if (isAP(polPage)) await shell.run(`kubectl delete ns ${p.namespace}`)
  })
}

test('Recommended policies', async({ page, ui, nav }) => {
  test.skip(MODE === 'fleet', 'https://github.com/rancher/kubewarden-ui/pull/703')

  await test.step('Edit Recommended policy settings', async() => {
    await nav.capolicy()
    await ui.tableRow('no-privileged-pod').action('Edit Policy Settings')

    const apps = new RancherAppsPage(page)
    await apps.updateApp('rancher-kubewarden-defaults', {
      navigate : false,
      questions: async() => {
        await ui.tab('no-privileged-pod policy settings').click()
        await ui.checkbox('Skip init containers').check()
      }
    })

    const capPage = new ClusterAdmissionPoliciesPage(page)
    await nav.capolicy('no-privileged-pod')
    await ui.button('Config').click()
    await capPage.selectTab('Settings')
    await expect(ui.codeMirror).toContainText('skip_init_containers: true')
  })
})
