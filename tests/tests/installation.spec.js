// @ts-check
const { test, expect } = require('@playwright/test');
const jsyaml = require('js-yaml');
const merge = require('lodash.merge');

// source (yarn dev) | rc (add github repo) | released (just install)
const ORIGIN = process.env.ORIGIN || (process.env.API ? 'source' : 'rc')

/**
 * @param {import('@playwright/test').Page} page
 *
 * Use:
 * await editYaml(page, d => d.telemetry.enabled = true )
 * await editYaml(page, '{"policyServer": {"telemetry": { "enabled": false }}}')
 */
async function editYaml(page, source) {
  const lines = await page.locator('.CodeMirror-code > div > pre.CodeMirror-line').allTextContents();

  let cmYaml = jsyaml.load(lines.join('\n')
    .replace(/\u00a0/g, " ")  // replace &nbsp; with space
    .replace(/\u200b/g, "")   // remove ZERO WIDTH SPACE last line
  );

  if (source instanceof Function) {
    source(cmYaml)
  } else {
    merge(cmYaml, jsyaml.load(source))
  }

  await page.locator('.CodeMirror-code').click()
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(jsyaml.dump(cmYaml))
}

// ==================================================================================================
// Prepare rancher

test('00 end user agreement', async({ page }) => {
  await page.goto('/dashboard');

  // login
  await page.locator('input[type=password]').fill('sa');
  await page.getByTestId('login-submit').click();

  // end user agreement
  await page.locator('label.checkbox-container')
     .filter({has: page.getByText('Allow collection of anonymous statistics')})
     .locator('span.checkbox-custom').uncheck()
  await page.getByTestId('setup-agreement').locator('.checkbox-custom').check();
  await page.getByTestId('setup-submit').click();
  // wait for local cluster to be Active
  await expect(page.getByTestId('sortable-cell-0-0')).toContainText('Active', {timeout: 30_000})
});

test('00 disable namespace filter', async({ page }) => {
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

test('00 enable extension developer features', async({ page }) => {
  if (ORIGIN != 'source') test.skip(true, "Skip: Use developer load only when testing source code")
  await page.goto('/dashboard/prefs')
  await expect(page.getByRole('heading', { name: 'Advanced Features' })).toBeVisible()
  await page.getByRole('checkbox', { name: 'Enable Extension developer features' }).check();
});


// ==================================================================================================
// Installation

test('01 enable extension support', async({ page }) => {
  // menu -> configuration -> extensions
  await page.goto('/dashboard/c/local/uiplugins');
  await expect(page.getByRole('heading', { name: 'Extension support is not enabled' })).toBeVisible()

  // Enable extensions
  await page.getByRole('button', { name: 'Enable' }).click();
  // don't add released extension repository
  if (ORIGIN != 'released') {
    await page.locator('label.checkbox-container')
      .filter({has: page.getByText('Add the Rancher Extension Repository')})
      .locator('span.checkbox-custom').uncheck()
  }
  await page.getByRole('button', { name: 'OK' }).click();

  // Wait for extensions to be enabled
  try {
    await expect(page.getByRole('tab', { name: 'Installed' })).toBeVisible({timeout: 60_000});
  } catch (e) {
    console.log('Reload - Not showing installed extensions tab')
    await page.reload();
    await expect(page.getByRole('tab', { name: 'Installed' })).toBeVisible();
  }

  // Wait for default list of extensions
  await expect(page.locator('.plugin', {hasText: 'Virtualization Manager'} )).toBeVisible();
  if (ORIGIN == 'released') {
    await page.getByRole('tab', { name: 'All', exact:true }).click()
    try {
      await expect(page.locator('.plugin', {hasText: 'Kubewarden'} )).toBeVisible();
    } catch (e) {
      console.log('Reload - Not showing kubewarden extension')
      await page.reload();
      await page.getByRole('tab', { name: 'All', exact:true }).click()
    }
    await expect(page.locator('.plugin', {hasText: 'Kubewarden'} )).toBeVisible();
  }

});

test('02 add UI charts repository', async({ page }) => {
  if (ORIGIN != 'rc') test.skip(true, "Skip: Add UI repository only when testing RCs")

  await page.goto('/dashboard/c/local/apps/catalog.cattle.io.clusterrepo/create')
  // Add kw extension repository
  await page.getByPlaceholder('A unique name').fill('kubewarden-github-charts');
  await page.getByPlaceholder('e.g. https://charts.rancher.io').fill('https://kubewarden.github.io/ui');
  await page.getByRole('button', { name: 'Create' }).click();

  // Check repository state is Active
  await expect(page
    .locator('tr.main-row')
    .filter({has: page.getByRole('link', {name: 'kubewarden-github-charts', exact: true})})
    .locator('td.col-badge-state-formatter')
  ).toHaveText('Active')
})

test('02 install kubewarden extension', async({ page }) => {
  if (ORIGIN == 'source') test.skip(true, "Skip: Don't install extension from repository when testing source code")
  await page.goto('/dashboard/c/local/uiplugins#available')

  // Select extension by icon that contains repo url, github or official
  const repo = ORIGIN == 'rc' ? 'kubewarden-github-charts' : 'rancher-ui-plugins'
  await page.getByTestId('extension-card-kubewarden')
    .filter({ has: page.locator(`xpath=//img[contains(@src, "clusterrepos/${repo}")]`) })
    .getByRole('button', { name: 'Install' }).click();

  await page.getByRole('dialog').getByRole('button', { name: 'Install' }).click();
  await expect(page.locator('.plugin', {hasText: 'Kubewarden'} ).getByRole('button', { name: 'Uninstall' })).toBeEnabled({timeout: 60_000});
});

test('02 developer load extension', async({ page }) => {
  if (ORIGIN != 'source') test.skip(true, "Skip: Use developer load only when testing source code")

  await page.goto('/dashboard/c/local/uiplugins')
  await expect(page.getByRole('heading', { name: 'Extensions', exact:true })).toBeVisible()

  await page.getByTestId('extensions-page-menu').click();
  await page.getByText('Developer Load').click();
  await expect(page.getByRole('heading', { name: 'Developer Load Extension' })).toBeVisible()

  await page.getByRole('textbox').first().fill('http://127.0.0.1:4500/kubewarden-0.0.1/kubewarden-0.0.1.umd.min.js');
  await page.locator('label.checkbox-container')
     .filter({has: page.getByText('Persist extension by creating custom resource')})
     .locator('span.checkbox-custom').check()

  await page.getByRole('button', { name: 'Load', exact:true }).click()
  await page.getByTestId('extension-reload-banner-reload-btn').click()
  await expect(page.locator('.plugin', {hasText: 'Kubewarden'} ).getByRole('button', { name: 'Uninstall' })).toBeEnabled();
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

  // Enable telemetry
  // await page.getByRole('button', { name: 'Edit YAML' }).click()
  // await editYaml(page, d => d.telemetry.enabled = true )
  // await page.getByRole('button', { name: 'Compare Changes' }).click()

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

  // Enable telemetry
  // await page.getByRole('button', { name: 'Edit YAML' }).click()
  // await editYaml(page, d => d.policyServer.telemetry.enabled = true)
  // await page.getByRole('button', { name: 'Compare Changes' }).click()

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
  await expect(page.locator(".subtype")).toHaveCount(29) // we have 28 + 1 custom
});

// ==================================================================================================
// Basic checks

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
