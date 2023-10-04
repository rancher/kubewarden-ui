import { test, expect } from './rancher-test';
import { Policy } from './pages/basepolicypage';
import { ClusterAdmissionPoliciesPage } from './pages/clusteradmissionpolicies.page';
import { PolicyReporterPage } from './pages/policyreporter.page';

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
test('PolicyReports', async({ page, ui }) => {
  const capPage = new ClusterAdmissionPoliciesPage(page)
  const reporter = new PolicyReporterPage(page)
  const expect_2m = expect.configure({timeout:2*60_000})

  const p: Policy = {
    title: 'Safe Labels',
    mode: 'Monitor',
    settings: async () => {
      await page.getByRole('tab', { name: 'Settings' }).click()
      const den = page.locator('.row').filter({hasText:'Denied labels'})
      await den.getByRole('button', {name: 'Add'}).click()
      await den.getByRole('textbox').fill('unsafelbl')

      // Customize because audit for "*" rules is skipped
      await ui.openYamlEditor()
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
    'k create ns audit-unsafe-ns',
    'k label ns audit-unsafe-ns unsafelbl=secret',
    'k run privpod -n audit-unsafe-ns --image=nginx:alpine --privileged',
  )
  const policy_row = await capPage.create(p, {wait: true})

  // Check that audit reported unsafe label and privileged pod
  await reporter.goto()
  await expect_2m(reporter.failCpBanner).toHaveText('1')
  await expect_2m(reporter.failNsBanner).toContainText('audit-unsafe-ns')
  await reporter.selectTab('Policy Reports')
  await expect(reporter.failNsTable.getByRole('cell', {name: 'privpod', exact: true})).toBeVisible()
  await reporter.selectTab('ClusterPolicy Reports')
  await expect(reporter.failCpTable.getByRole('cell', {name: 'audit-unsafe-ns', exact: true})).toBeVisible()

  // Cleanup & check results are gone
  await ui.shell('k delete ns audit-unsafe-ns')
  await capPage.goto()
  await policy_row.delete()
  await reporter.goto()
  await expect_2m(reporter.failCpBanner).toHaveText('0')
  await reporter.selectTab('Policy Reports')
  await expect(reporter.failNsTable.getByText('privpod')).not.toBeVisible()
  await reporter.selectTab('ClusterPolicy Reports')
  await expect(reporter.failCpTable.getByText('audit-unsafe-ns')).not.toBeVisible()
});
