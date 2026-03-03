import { test, expect } from './rancher/rancher-test'
import { Policy, ClusterAdmissionPoliciesPage } from './pages/policies.page'
import { PolicyReporterPage } from './pages/policyreporter.page'

const testNs = 'audit-unsafe-ns'
const testPod = 'audit-pod-privileged'
const policyLabels = 'audit-safelabels'

/**
 * Prerequisities:
 *  - Audit scanner is enabled and set to run every minute during controller installation.
 *  - Recommended policies are enabled.
 * This test checks that audit scanner shows reports
 *  - create privileged pod that fails recommended policy no-privileged-pods
 *  - create namespace with forbidden label to break safe-labels policy
 *  - create safe-labels policy
 *  - check errors are reported
 *  - delete policy and resources and check error are gone
 */
test('New resources should be reported', async({ ui, page, nav, shell }) => {
  const capPage = new ClusterAdmissionPoliciesPage(page)
  const reporter = new PolicyReporterPage(page)

  const p: Policy = {
    title   : 'Safe Labels',
    mode    : 'Monitor',
    name    : policyLabels,
    settings: async() => {
      await ui.tab('Settings').click()
      const den = page.locator('.row').filter({ hasText: 'Denied labels' })
      await den.getByRole('button', { name: 'Add' }).click()
      await den.getByRole('textbox').fill('unsafelbl')
    },
    yamlPatch: (y) => { // Customize because audit for "*" rules is skipped
      y.spec.rules[0].apiGroups[0] = ''
      y.spec.rules[0].apiVersions[0] = 'v1'
      y.spec.rules[0].resources[0] = 'namespaces'
    }
  }

  // Create policy and resources that break rules
  await capPage.goto()
  await shell.runBatch(
    `kubectl create ns ${testNs}`,
    `kubectl label ns ${testNs} unsafelbl=secret`,
    `kubectl run ${testPod} -n ${testNs} --image=nginx:alpine --privileged`,
  )
  await capPage.create(p, { wait: true })

  // Check that audit reported unsafe label and privileged pod
  await reporter.runJob()
  await nav.kubewarden('Policy Reporter')
  await reporter.selectTab('Dashboard')
  await expect(reporter.getCard('fail')).toHaveText('1', { timeout: 2 * 60_000 })
  await expect(reporter.getChip(testNs, 'fail')).toHaveText('1')

  await reporter.selectTab('Kubewarden')
  await expect(reporter.getChip(`clusterwide-${policyLabels}`, 'fail')).toHaveText('1')
  await expect(reporter.getChip('clusterwide-no-privileged-pod', 'fail')).toHaveText('1')
})

test('Check reports on resources details page', async({ ui, nav }) => {
  // Check Pods Compliance column
  await nav.explorer('Workloads', 'Pods')
  const failrow = ui.tableRow(testPod, { group: testNs })
  await expect(failrow.column('Compliance').locator('div.bg-error')).toHaveText('1')
  await expect(failrow.column('Compliance').locator('div.bg-success')).toHaveText('5')

  // Check Compliance tab on pod details
  await failrow.open()
  await ui.tab('Compliance').click()
  await expect(ui.tableRow({ Policy: 'no-privileged-pod' }).column('Status')).toHaveText('fail')
  await expect(ui.tableRow({ Policy: 'drop-capabilities' }).column('Status')).toHaveText('pass')

  // Check namespace
  await nav.explorer('Cluster', 'Projects/Namespaces')
  await expect(ui.tableRow(testNs).column('Compliance').locator('div.bg-error')).toHaveText('1')
  await ui.tableRow(testNs).open()
  await ui.tab('Compliance').click()
  await expect(ui.tableRow({ Policy: policyLabels }).column('Status')).toHaveText('fail')
})

test('Cleanup & check results are gone', async({ page, ui, nav, shell }) => {
  const reporter = new PolicyReporterPage(page)

  await nav.capolicies()
  await ui.tableRow(policyLabels).delete()
  await shell.runBatch(
    `kubectl delete ns ${testNs}`,
    'kubectl delete reps,creps -A --all'
  )

  await nav.kubewarden('Policy Reporter')
  await expect(reporter.frame.getByText('No resources for the selected kinds found')).toBeVisible()
})
