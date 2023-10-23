import { BasePolicyPage } from './basepolicypage';

export class ClusterAdmissionPoliciesPage extends BasePolicyPage {

  async goto(): Promise<void> {
    // await this.nav.explorer('Kubewarden', 'ClusterAdmissionPolicies')
    await this.page.goto('dashboard/c/local/kubewarden/policies.kubewarden.io.clusteradmissionpolicy')
  }

}
