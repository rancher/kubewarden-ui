// @ts-check
const { test, expect } = require('@playwright/test');

const DEVEL = 'https://kubewarden.github.io/ui' // use rc-builds REPO

test('00 first run', async({ page }) => {
  await page.goto('/');

  // login
  await page.locator('input[type=password]').fill('sa');
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


test('02 add devel repository', async({ page }) => {
  if (!DEVEL) test.skip()

  await page.goto('/dashboard/c/local/apps/catalog.cattle.io.clusterrepo/create')
  // Add kw extension repository
  await page.getByPlaceholder('A unique name').fill('kubewarden-charts-devel');
  await page.getByPlaceholder('e.g. https://charts.rancher.io').fill(DEVEL);
  await page.getByRole('button', { name: 'Create' }).click();

  // Check repository state is Active
  await expect(page
    .locator('tr.main-row')
    .filter({has: page.getByRole('link', {name: 'kubewarden-charts-devel', exact: true})})
    .locator('td.col-badge-state-formatter')
  ).toHaveText('Active')
})


test('02 install kubewarden extension', async({ page }) => {
  await page.goto('/dashboard/c/local/uiplugins#available')

  // Select extension by icon that contains repo url, devel or official
  const repo = DEVEL ? 'kubewarden-charts-devel' : 'rancher-ui-plugins'
  await page.getByTestId('extension-card-kubewarden')
    .filter({ has: page.locator(`xpath=//img[contains(@src, "clusterrepos/${repo}")]`) })
    .getByRole('button', { name: 'Install' }).click();

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
    await page.getByRole('button', { name: 'Reload', exact: true }).click()
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

  await expect(page.getByText('Active 6 of 6 Global Policies / 100%')).toBeVisible({timeout:60_000})
  await expect(page.getByText('Active 0 of 0 Namespaced Policies / 0%')).toBeVisible()
  try {
    await expect(page.getByText('Active 1 of 1 Pods / 100%')).toBeVisible()
  } catch (e) {
    console.log('Reload - https://github.com/kubewarden/ui/issues/245')
    await page.reload();
    await expect(page.getByText('Active 1 of 1 Pods / 100%')).toBeVisible()
  }
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
