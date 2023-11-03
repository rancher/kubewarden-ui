import { test, expect } from './rancher-test';
import { PolicyServer, PolicyServersPage } from './pages/policyservers.page';
import { AdmissionPoliciesPage, ClusterAdmissionPoliciesPage, BasePolicyPage, Policy } from './pages/policies.page';
import { TableRow } from './components/table-row';
import { RancherUI } from './pages/rancher-ui';

let row: TableRow
let rui: RancherUI

async function testRequiredFields(polPage: BasePolicyPage) {
    await test.step('Creation without required fields', async () => {
        const p: Policy = { title: 'Pod Privileged Policy', name: 'test-policy-podpriv' }
        const finishBtn = rui.button('Finish')

        await polPage.goto()
        await polPage.open(p)
        // Try to create without name
        await polPage.setName('')
        await finishBtn.click()
        await expect(rui.page.locator('div.error').getByText('Required value: name')).toBeVisible()
        await finishBtn.waitFor({ timeout: 10_000 }) // button name changes back Error -> Finish
        // Try without module
        await polPage.setValues(p)
        await polPage.setModule('')
        await expect(finishBtn).not.toBeEnabled()
    })
}

async function testModes(polPage: BasePolicyPage) {
    await test.step('Try monitor & protect mode', async () => {
        // Create in protect mode
        row = await polPage.create({ title: 'Pod Privileged Policy', name: 'test-policy-mode-protect', mode: 'Protect' }, { wait: true })
        await expect(row.column('Mode')).toHaveText('Protect')
        await row.delete()

        // Create in monitor, change to protect, can't change back
        row = await polPage.create({ title: 'Pod Privileged Policy', name: 'test-policy-mode-monitor', mode: 'Monitor' }, { wait: true })
        await expect(row.column('Mode')).toHaveText('Monitor')
        await polPage.updateToProtect(row)
        await expect(row.column('Mode')).toHaveText('Protect')
        await row.delete()
    })
}

async function testRules(polPage: BasePolicyPage) {
    await test.step("Rules can't be edited", async () => {
        await polPage.open({ title: 'Pod Privileged Policy', name: '' })
        await polPage.selectTab('Rules')
        await expect(rui.page.locator('section#rules').locator('input').first()).toBeDisabled()
    })
}

async function testPolicyServers(polPage: BasePolicyPage) {
    await test.step('Try default & custom policy server', async () => {
        let customPS: PolicyServer = { name: 'test-cap-custom-ps' }
        const ptype = polPage instanceof ClusterAdmissionPoliciesPage ? 'ClusterAdmission' : 'Admission'

        // Create custom policy server
        const psPage = new PolicyServersPage(rui.page)
        await psPage.create(customPS)

        // Create policy with custom PS
        row = await polPage.create({ title: 'Pod Privileged Policy', name: 'test-policy-custom-ps', server: customPS.name })
        await expect(row.column('Policy Server')).toHaveText(customPS.name)
        // Delete custom PS, check policy is deleted too
        await psPage.delete(customPS.name)
        await polPage.goto()
        await expect(row.row).not.toBeVisible()

        // Create policy with default PS
        row = await polPage.create({ title: 'Pod Privileged Policy', name: 'test-policy-default-ps' })
        await expect(row.column('Policy Server')).toHaveText('default')
        // Check details page
        await row.open()
        await expect(rui.page.getByText(`${ptype}Policy: test-policy-default-ps`)).toBeVisible()
        await expect(rui.page.getByText('API Versions')).toBeVisible()
        // Check config page
        await rui.page.locator('div.actions-container').getByRole('button', { name: 'Config', exact: true }).click()
        await expect(rui.input('Name*')).toHaveValue('test-policy-default-ps')
        await polPage.delete(row)
    })
}

test('ClusterAdmissionPolicies ', async ({ page, ui }) => {
    rui = ui
    const capPage = new ClusterAdmissionPoliciesPage(page)
    await testRequiredFields(capPage)
    await testModes(capPage)
    await testPolicyServers(capPage)
    await testRules(capPage)
});

test('AdmissionPolicies ', async ({ page, ui }) => {
    rui = ui
    const apPage = new AdmissionPoliciesPage(page)
    await testRequiredFields(apPage)
    await testModes(apPage)
    await testPolicyServers(apPage)
    await testRules(apPage)

    await test.step('Try default & custom policy server', async () => {

    })
});