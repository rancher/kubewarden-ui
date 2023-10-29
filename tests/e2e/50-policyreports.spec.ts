import { test, expect } from './rancher-test';
import { Policy } from './pages/basepolicypage';
import { ClusterAdmissionPoliciesPage } from './pages/clusteradmissionpolicies.page';
import { PolicyReporterPage } from './pages/policyreporter.page';

const testNs = 'audit-unsafe-ns'
const testPod = 'audit-pod-privileged'
const policyLabels = 'audit-safelabels'
const policyPrivpod = 'no-privileged-pod' // recommended policy

const expect_2m = expect.configure({timeout:2*60_000})

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
test('New resources should be reported', async({ page, ui, nav }) => {
  const capPage = new ClusterAdmissionPoliciesPage(page)
  const reporter = new PolicyReporterPage(page)

  const p: Policy = {
    title: 'Safe Labels',
    mode: 'Monitor',
    name: policyLabels,
    settings: async () => {
      await page.getByRole('tab', { name: 'Settings' }).click()
      const den = page.locator('.row').filter({hasText:'Denied labels'})
      await den.getByRole('button', {name: 'Add'}).click()
      await den.getByRole('textbox').fill('unsafelbl')

      // Customize because audit for "*" rules is skipped
      await ui.openView('Edit YAML')
      await ui.editYaml(d => {
        d.spec.rules[0].apiGroups[0] = ""
        d.spec.rules[0].apiVersions[0] = "v1"
        d.spec.rules[0].resources[0] = "namespaces"
      })
    }
  }

  // Create policy and resources that break rules
  await capPage.goto()
  await ui.shell(
    `k create ns ${testNs}`,
    `k label ns ${testNs} unsafelbl=secret`,
    `k run ${testPod} -n ${testNs} --image=nginx:alpine --privileged`,
  )
  await capPage.create(p, {wait: true})

  // Check that audit reported unsafe label and privileged pod
  await reporter.runJob()
  await nav.explorer('Kubewarden', 'Policy Reporter')
  await reporter.selectTab('Dashboard')
  await expect_2m(reporter.failCpBanner).toHaveText('1')
  await expect_2m(reporter.failNsBanner).toContainText(testNs)
  await reporter.selectTab('Policy Reports')
  await expect(reporter.failNsTable.getByRole('cell', {name: testPod, exact: true})).toBeVisible()
  await reporter.selectTab('ClusterPolicy Reports')
  await expect(reporter.failCpTable.getByRole('cell', {name: testNs, exact: true})).toBeVisible()

})

test('Check reports on resources details page', async({ page, ui, nav }) => {
  const ORIGIN = process.env.ORIGIN || (process.env.API ? 'source' : 'rc');
  test.skip(ORIGIN === 'released', 'Requires kubewarden UI > 1.3.0')

  const complianceTab = page.getByRole('tablist').locator('li#policy-report-tab')
  // Check Pods Compliance column
  await nav.explorer('Workloads', 'Pods')
  const failrow = ui.getRow(testPod, {group: testNs})
  await expect(failrow.column('Compliance').locator('div.bg-error')).toHaveText('1')
  await expect(failrow.column('Compliance').locator('div.bg-success')).toHaveText('5')

  // Check Compliance tab on pod details
  await failrow.open()
  await complianceTab.click()
  await expect(ui.getRow({'Policy': policyPrivpod}).column('Status')).toHaveText('fail')

  // Check namespace
  await nav.explorer('Cluster', 'Projects/Namespaces')
  await ui.getRow(testNs).open()
  await complianceTab.click()
  await expect(ui.getRow({Name: testPod, Policy: policyPrivpod}).column('Status')).toHaveText('fail')
})

test('Cleanup & check results are gone', async({ page, ui, nav }) => {
  const reporter = new PolicyReporterPage(page)

  await nav.explorer('Kubewarden', 'ClusterAdmissionPolicies')
  await ui.shell(`k delete ns ${testNs}`)
  await ui.getRow(policyLabels).delete()

  await nav.explorer('Kubewarden', 'Policy Reporter')
  await reporter.selectTab('Dashboard')
  await expect_2m(reporter.failCpBanner).toHaveText('0')
  await expect_2m(reporter.failNsBanner).not.toContainText(testNs)
});
