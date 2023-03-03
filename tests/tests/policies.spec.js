// @ts-check
const { test, expect } = require('@playwright/test');
const { timeout } = require('../playwright.config');

test.describe.configure({ mode: 'parallel' });

// TODO: Scrape list of policies from ArtifactHub?
const policies = [
  { name: 'Custom Policy', action: setupCustomPolicy },
  { name: 'Allow Privilege Escalation PSP' },
  { name: 'Allowed Fs Groups PSP' },
  { name: 'Allowed Proc Mount Types PSP' },
  { name: 'Apparmor PSP' },
  { name: 'Capabilities PSP' },
  { name: 'Disallow Service Loadbalancer' },
  { name: 'Disallow Service Nodeport' },
  { name: 'Environment Variable Secrets Scanner' },
  { name: 'Flexvolume Drivers Psp' },
  { name: 'Ingress Policy' },
  { name: 'Pod Privileged Policy' },
  { name: 'Readonly Root Filesystem PSP' },
  { name: 'Safe Annotations' },
  { name: 'Safe Labels' },
  { name: 'Seccomp PSP' },
  { name: 'Sysctl PSP' },
  { name: 'Trusted Repos' },
  { name: 'Volumes PSP' },
  // { name: 'Pod Runtime', action: null }, broken (empty) policy rules - https://github.com/kubewarden/pod-runtime-class-policy/issues/14
  { name: 'Hostpaths PSP' },
  { name: 'User Group PSP', action: setupUserGroupPSP }, // - only one rule should be required - https://github.com/kubewarden/user-group-psp-policy/issues/45
  { name: 'Verify Image Signatures', action: setupVerifyImageSignatures }, // - add button not workind -  - https://github.com/kubewarden/ui/issues/239 - https://github.com/kubewarden/ui/issues/237
  { name: 'volumeMounts', action: setupVolumeMounts }, // - https://github.com/kubewarden/ui/issues/259
  { name: 'Host Namespaces PSP' },
  { name: 'Selinux PSP', action: setupSelinuxPSP }, // https://github.com/kubewarden/ui/issues/240 - extra RunAsAny
  { name: 'Environment Variable Policy', action: setupEnvironmentVariablePolicy }, // - at least one rule is required, UI does not check
  { name: 'Deprecated API Versions', action: setupDeprecatedAPIVersions }, // https://github.com/kubewarden/ui/issues/242 - version not required
]

const polmode   = process.env.mode || 'monitor'
const polserver = process.env.server || 'default'
const polkeep   = process.env.keep || false

async function setupCustomPolicy(page) {
  await page.locator('input:near(:text("Module*"))').first().fill('ghcr.io/kubewarden/policies/pod-privileged:v0.2.4')
  await page.getByRole('tab', { name: 'Rules' }).click()
  await page.getByText('Resource type*').click()
  await page.getByRole('option', { name: 'pods', exact: true }).click()
  await page.getByText('API Versions*').click()
  await page.getByRole('option', { name: 'v1', exact: true }).click()
  await page.getByText('Operation type*').click()
  await page.getByRole('option', { name: 'CREATE', exact: true }).click()
}

async function setupVolumeMounts(page) {
  await page.getByRole('tab', { name: 'Settings' }).click()
  await page.getByText('Reject', {exact: true}).click()
  await page.getByRole('option', {name: 'anyIn'}).click()
  await page.getByRole('button', { name: 'Add'}).click()
  await page.getByPlaceholder('e.g. bar').fill('/nomount')
}

async function setupSelinuxPSP(page) {
  await page.getByRole('tab', { name: 'Settings' }).click()
  await page.getByText('SE Linux Options', {exact: true}).click()
  await page.getByRole('option', {name: 'RunAsAny'}).click()
}

async function setupDeprecatedAPIVersions(page) {
  await page.getByRole('tab', { name: 'Settings' }).click()
  await page.locator('input:near(:text("Kubernetes Version*"))').first().fill('v1.24.9+k3s2')
}

async function setupVerifyImageSignatures(page) {
  await page.getByRole('tab', { name: 'Settings' }).click()
  await page.getByRole('button', {name: 'Add', exact: true}).click()
  await page.locator('input:near(:text("Image*"))').first().fill('ghcr.io/kubewarden/*')
  // yaml editor
  await page.getByTestId('yaml-editor-code-mirror').getByText('owner: \'\'').locator('.cm-string').click();
  await page.keyboard.type('kubewarden')
}

async function setupEnvironmentVariablePolicy(page) {
  await page.getByRole('tab', { name: 'Settings' }).click()
  await page.getByRole('button', {name: 'Add', exact: true}).click()
  // yaml editor
  await page.getByTestId('yaml-editor-code-mirror').getByText('name: \'\'').locator('.cm-string').click();
  await page.keyboard.type('novar')
}

async function setupUserGroupPSP(page) {
  await page.getByRole('tab', { name: 'Settings' }).click()
  for (const role of await page.getByRole('combobox').all()) {
    role.click()
    await page.getByRole('option', { name: 'RunAsAny', exact: true }).click()
  }
}


// Generate installation test for every policy.
for (const policy of policies) {
  test(`install: ${policy.name}`, async ({ page }) => {
    const polname = 'test-' + policy.name.replace(/\s+/g, '-').toLowerCase()

    await page.goto('/dashboard/c/local/kubewarden/policies.kubewarden.io.clusteradmissionpolicy/create')
    await expect(page.getByRole('heading', { name: 'Finish: Step 1' })).toBeVisible()

    // Select policy
    await page.getByRole('heading', { name: policy.name, exact: true }).click()
    await page.getByRole('tab', { name: 'Values' }).click(); // skip readme
    // Fill name, mode, policy server
    await page.getByPlaceholder('A unique name').fill(polname)
    await page.getByRole('radio', {name: polmode}).check()
    await page.getByText('Policy Server', {exact: true}).click()
    await page.getByRole('option', {name: polserver}).click()

    // Extra policy settings
    if (policy.action) await policy.action(page)

    // Create policy
    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page).toHaveURL(/.*clusteradmissionpolicy$/);   
    await expect(page.getByRole('link', {name: polname, exact: true})).toBeVisible()

    if (!polkeep) {
      // Check policy state is Active
      await expect(page
        .locator('tr.main-row')
        .filter({has: page.getByRole('link', {name:polname, exact: true})})
        .locator('td.col-policy-status')
      ).toHaveText('Active', {timeout: 120_000})

      // Delete policy
      await page.locator(`button[id$='+${polname}']`).click()  // id="actionButton+0+rancher-kubewarden-controller"
      await page.getByRole('listitem').getByText('Delete').click()
      await page.getByTestId('prompt-remove-confirm-button').click()
      await expect(page.getByRole('link', {name: polname, exact: true})).not.toBeVisible()
    }
  });
}

