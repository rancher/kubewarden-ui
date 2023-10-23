import { BasePolicyPage } from './basepolicypage';

export class AdmissionPoliciesPage extends BasePolicyPage {

  async goto(): Promise<void> {
    // await this.nav.explorer('Kubewarden', 'AdmissionPolicies')
    await this.page.goto('dashboard/c/local/kubewarden/policies.kubewarden.io.admissionpolicy')
  }

}
