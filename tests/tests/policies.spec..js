// @ts-check
const { test, expect } = require('@playwright/test');

test.describe.configure({ mode: 'parallel' });

const policies = process.env.policy?.split("#") || [
//'Custom Policy',
  'Allow Privilege Escalation PSP',
  'Allowed Fs Groups PSP',
  'Allowed Proc Mount Types PSP',
  'Apparmor PSP',
  'Capabilities PSP',
  'Disallow Service Loadbalancer',
  'Disallow Service Nodeport',
  'Environment Variable Secrets Scanner',
  'Flexvolume Drivers Psp',
  'Ingress Policy',
  'Pod Privileged Policy',
  'Readonly Root Filesystem PSP',
  'Safe Annotations',
  'Safe Labels',
  'Seccomp PSP',
  'Sysctl PSP',
  'Trusted Repos',
  'Volumes PSP']

/* Broken policies
'Pod Runtime',
'Hostpaths PSP',
'User Group PSP',
'Verify Image Signatures',
'volumeMounts',
'Host Namespaces PSP',
'Selinux PSP',
'Environment Variable Policy',
'Deprecated API Versions' ]


[clusterwide-test-pod-runtime]
 - https://github.com/kubewarden/pod-runtime-class-policy/issues/14 (can't create - wrong rules)
[clusterwide-test-hostpaths-psp] settings are not valid: Some("pathPrefix key is missing; pathPrefix key is missing"),
 - https://github.com/kubewarden/ui/issues/236
[clusterwide-test-user-group-psp] settings are not valid: Some("Invalid run_as_user settings: invalid rule."),
 - https://github.com/kubewarden/user-group-psp-policy/issues/45
[clusterwide-test-verify-image-signatures] settings are not valid: Some("Error invoking settings validation callback: GuestCallFailure(\"Error decoding validation payload {\\\"modifyImagesWithDigest\\\":true,\\\"rule\\\":\\\"PublicKey\\\",\\\"description\\\":null,\\\"signatures\\\":{\\\"image\\\":\\\"\\\"}}: Error(\\\"invalid type: map, expected a sequence\\\", line: 1, column: 82)\")"), 
 - https://github.com/kubewarden/ui/issues/239 - invalid yaml
 - https://github.com/kubewarden/ui/issues/237 - missing options
[clusterwide-test-volumemounts] settings are not valid: Some("volumeMountsNames is empty"), 
 - should be required, file UI issue
[clusterwide-test-host-namespaces-psp] settings are not valid: Some("Error invoking settings validation callback: GuestCallFailure(\"Error decoding validation payload {\\\"allow_host_network\\\":false,\\\"allow_host_ports\\\":{\\\"max\\\":0,\\\"min\\\":0},\\\"allow_host_pid\\\":false,\\\"description\\\":null,\\\"allow_host_ipc\\\":false}: Error(\\\"invalid type: map, expected a sequence\\\", line: 1, column: 47)\")"), 
 - https://github.com/kubewarden/ui/issues/238 - invalid yaml
[clusterwide-test-selinux-psp] settings are not valid: Some("you have to provide at least a user, group, type or level settings"), 
 - https://github.com/kubewarden/ui/issues/240 - extra RunAsAny
[clusterwide-test-environment-variable-policy] settings are not valid: Some("Error invoking settings validation callback: GuestCallFailure(\"Error decoding validation payload {\\\"description\\\":null,\\\"rules\\\":{\\\"environmentVariables\\\":{\\\"name\\\":\\\"\\\",\\\"value\\\":\\\"\\\"},\\\"reject\\\":\\\"anyIn\\\"}}: Error(\\\"invalid type: map, expected a sequence\\\", line: 1, column: 28)\")"), 
 - https://github.com/kubewarden/ui/issues/241 invalid yaml
[clusterwide-test-deprecated-api-versions] settings are not valid: Some("Error invoking settings validation callback: GuestCallFailure(\"Error decoding validation payload {\\\"kubernetes_version\\\":\\\"\\\",\\\"description\\\":null,\\\"deny_on_deprecation\\\":true}: Error(\\\"unexpected end of input while parsing major version number\\\", line: 1, column: 24)\")")
 - https://github.com/kubewarden/ui/issues/242 - version not required

 */

// generate installation test for every policy
for (const pol of policies) {
  test(`install: ${pol}`, async ({ page }) => {
    const polname = 'test-' + pol.replace(/\s+/g, '-').toLowerCase()
    const polmode = process.env.mode || 'monitor'

    await page.goto('/dashboard/c/local/kubewarden/policies.kubewarden.io.clusteradmissionpolicy/create')
    await expect(page.getByRole('heading', { name: 'Finish: Step 1' })).toBeVisible()
  
    await page.getByRole('heading', { name: pol, exact: true }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByPlaceholder('A unique name').fill(polname)
    await page.getByRole('radio', {name: polmode}).check()
    await page.getByRole('button', { name: 'Finish' }).click()
  
    await expect(page).toHaveURL(/.*clusteradmissionpolicy$/);   
    await expect(page.getByRole('link', {name: polname, exact: true})).toBeVisible()
    // await expect(page
    //   .locator('tr.main-row')
    //   .filter({has: page.getByRole('link', {name:polname, exact: true})})
    //   .locator('td.col-policy-status')
    // ).toHaveText('Pending')
  });
}

test.skip('11 add policyserver', async({ page }) => {
    // add policy server
    await page.goto('/dashboard/c/local/kubewarden/policies.kubewarden.io.policyserver/create')
    await page.getByPlaceholder('A unique name').fill('playwright-ps');
    await page.getByRole('button', { name: 'Save' }).click();
  
    // add policy
    await page.goto('/dashboard/c/local/kubewarden/policies.kubewarden.io.clusteradmissionpolicy/create')
  
    await page.getByRole('heading', { name: 'Pod Privileged Policy' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByPlaceholder('A unique name').fill('playwright-policy');
    await page.getByRole('button', { name: 'Finish' }).click();
  
  });
