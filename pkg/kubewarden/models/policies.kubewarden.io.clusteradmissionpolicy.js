import PolicyModel from '@kubewarden/plugins/policy-class';

export default class ClusterAdmissionPolicy extends PolicyModel {
  get _availableActions() {
    let actions = super._availableActions;

    // Remove edit actions for KW default policies and fleet policies
    // https://github.com/rancher/kubewarden-ui/issues/682
    if (this.isKubewardenDefaultPolicy && !this.isDeployedWithFleet) {
      const editActions = ['goToEdit', 'goToEditYaml'];

      actions = actions.filter((action) => !editActions.includes(action.action));

      // Add Edit Policy Settings action
      const defaultPolicySettings = {
        action: 'editPolicySettings',
        icon:   'icon icon-edit',
        label:  'Edit Policy Settings',
      };

      actions.unshift(defaultPolicySettings);
    }

    return actions;
  }

  set _availableActions(actions) {
    this._availableActions = actions;
  }

  editPolicySettings() {
    const route = this.kubewardenDefaultsRoute;

    if (route) {
      this.currentRouter().push(route);
    } else {
      console.error('Could not determine the route to the Kubewarden Defaults chart.');
    }
  }
}
