// @ts-check
const { test, expect } = require('@playwright/test');

// you need to wait until cluster is ready before installation

test('00 first run', async({ page }) => {
  await page.goto('/');

  // login
  await page.getByRole('textbox').fill('sa');
  await page.getByTestId('login-submit').click();
  // end user agreement
  await page.getByTestId('setup-agreement').locator('.checkbox-custom').check();
  await page.getByTestId('setup-submit').click();
  // wait for local cluster to be Active
  await expect(page.getByTestId('sortable-cell-0-0')).toContainText('Active', {timeout: 30_000})
});


test('01 enable extension support', async({ page }) => {
  // menu -> configuration -> extensions
  await page.goto('/dashboard/c/local/uiplugins');

  // click Enable button
  await page.getByRole('button', { name: 'Enable' }).click();
  await page.getByRole('button', { name: 'OK' }).click();

  // wait for extension list
  try {
    await expect(page.getByRole('tab', { name: 'Installed' })).toBeVisible({timeout: 30_000});
  } catch (e) {
    console.log('Reload - Not showing list of extensions')
    await page.reload();
    await expect(page.getByRole('tab', { name: 'Installed' })).toBeVisible();
  }

  // wait for extensions
  await page.getByRole('tab', { name: 'Available' }).click()
  await page.waitForTimeout(5000)
  await page.reload()
  await expect(page.locator('.plugin', {hasText: 'Kubewarden'} )).toBeVisible();
});


test('02 install kubewarden extension', async({ page }) => {
  await page.goto('/dashboard/c/local/uiplugins#available')
  // Install kw extension
  await page.locator('.plugin', {hasText: /Kubewarden/} ).getByRole('button', { name: 'Install' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Install' }).click();
  await expect(page.locator('.plugin', {hasText: 'Kubewarden'} ).getByRole('button', { name: 'Uninstall' })).toBeEnabled({timeout: 30_000});
});


test('03 install kubewarden', async({ page }) => {
  // add kubewarden-charts repository
  await page.goto('/dashboard/c/local/kubewarden/dashboard')
  await page.getByRole('button', { name: 'Install Kubewarden' }).click();
  await page.getByRole('button', { name: 'Add Kubewarden Repository' }).click();

  try {
    await expect(page.getByRole('button', { name: 'Install Kubewarden' })).toBeEnabled()
  } catch (e) {
    console.log('Reload - https://github.com/kubewarden/ui/issues/201')
    await page.reload();
    await page.getByRole('button', { name: 'Install Kubewarden' }).click();
  }
  await page.getByRole('button', { name: 'Install Kubewarden' }).click();
  await expect(page.getByRole('heading', { name: 'Install: Step 1' })).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Install' }).click();
  await expect(page.locator('#windowmanager').getByText(/SUCCESS: helm upgrade .* rancher-kubewarden-crds/)).toBeVisible({timeout:30_000})
  await expect(page.locator('#windowmanager').getByText(/SUCCESS: helm upgrade .* rancher-kubewarden-controller/)).toBeVisible({timeout:60_000})

  // check controller is active
  await page.getByRole('navigation').getByRole('link', { name: 'Kubewarden' }).click()
  try {
    await expect(page.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()
  } catch (e) {
    console.log('Reload - kubewarden installation done but not detected')
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()
  }
});


test('04 install default policyserver', async({ page }) => {
  await page.goto('/dashboard/c/local/kubewarden/dashboard')

  await page.getByRole('link', { name: 'PolicyServers' }).click()
  await expect(page.getByRole('heading', { name: 'PolicyServers' })).toBeVisible()

  await page.getByRole('button', { name: 'Install Chart' }).click()
  await expect(page.getByRole('heading', { name: 'Install: Step 1' })).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('checkbox', { name: 'Enable recommended policies' }).check()
  await page.getByRole('button', { name: 'Install' }).click();

  await expect(page.locator('#windowmanager').getByText(/SUCCESS: helm upgrade .* rancher-kubewarden-defaults/)).toBeVisible({timeout:40_000})
  // wait for policy server?
});


test('05 whitelist artifacthub', async({ page }) => {
  await page.goto('/dashboard/c/local/kubewarden/policies.kubewarden.io.clusteradmissionpolicy/create')
  await expect(page.getByRole('heading', { name: 'Custom Policy' })).toBeVisible()
  await expect(page.locator('.subtype')).toHaveCount(1);

  await expect(page.getByText('Official Kubewarden policies are hosted on ArtifactHub')).toBeVisible()
  await page.getByRole('button', { name: 'Add ArtifactHub To Whitelist' }).click();
  
  await expect(page.getByRole('heading', { name: 'Pod Privileged Policy' })).toBeVisible()
  await expect(page.locator(".subtype >> nth=25")).toBeVisible() // we have now 27+1 policies
});

test('06 disable namespace filter', async({ page }) => {
  await page.goto('/dashboard/c/local/apps/catalog.cattle.io.app')
  await expect(page.getByRole('heading', { name: 'Installed Apps' })).toBeVisible()

  const allns = page.locator(".ns-filter").filter({ hasText: 'All Namespaces' })
  if (!await allns.isVisible()) {
      await page.keyboard.press('n');
      await page.locator("#all").click();
      await page.keyboard.press('Escape');
  }
  await expect(page.getByText('Namespace: cattle-system')).toBeVisible()
});

test('10 check overview page', async({ page }) => {
  await page.goto('/dashboard/c/local/kubewarden/dashboard')
  await expect(page.getByRole('heading', { name: 'Welcome to Kubewarden' })).toBeVisible()

  await expect(page.getByRole('link', { name: 'Create Policy Server' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create Admission Policy' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create Cluster Admission Policy' })).toBeVisible()
  
  // kubewarden overview
  await expect(page.getByText('Active 1 of 1 Pods / 100%')).toBeVisible({timeout:60_000})
  await expect(page.getByText('Active 6 of 6 Global Policies / 100%')).toBeVisible()
  await expect(page.getByText('Active 0 of 0 Namespaced Policies / 0%')).toBeVisible()
});

test('11 check policyservers page', async({ page }) => {
  await page.goto('/dashboard/c/local/kubewarden/policies.kubewarden.io.policyserver')
  await expect(page.getByRole('heading', { name: 'PolicyServers' })).toBeVisible()

  await expect(page.locator('.col-policy-server-status')).toHaveCount(1);
  await expect(page.getByTestId('sortable-cell-0-0')).toHaveText('Active')
  await expect(page.getByTestId('sortable-cell-0-1')).toHaveText('default')
  await expect(page.getByTestId('sortable-cell-0-3')).toContainText('6')
});

test('12 check clusteradmissionpolicies page', async({ page }) => {
  await page.goto('/dashboard/c/local/kubewarden/policies.kubewarden.io.clusteradmissionpolicy')
  await expect(page.getByRole('heading', { name: 'ClusterAdmissionPolicies' })).toBeVisible()

  await expect(page.locator('.col-policy-status')).toHaveCount(6);
  await expect(page.locator('.col-policy-status').getByText('Active')).toHaveCount(6);

  await expect(page.locator('.col-link-detail').first()).not.toBeEmpty();
});

test('13 check admissionpolicies page', async({ page }) => {
  await page.goto('/dashboard/c/local/kubewarden/policies.kubewarden.io.admissionpolicy')
  await expect(page.getByRole('heading', { name: 'AdmissionPolicies' })).toBeVisible()
  await expect(page.getByText('There are no rows to show.')).toBeVisible()
});
