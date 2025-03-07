import ClusterAdmissionPolicy from '@kubewarden/models/policies.kubewarden.io.clusteradmissionpolicy';
import PolicyModel from '@kubewarden/plugins/policy-class';

describe('ClusterAdmissionPolicy', () => {
  let instance: ClusterAdmissionPolicy;
  let rootGetters: Record<string, any>;
  let dispatch: jest.Mock;

  beforeEach(() => {
    instance = new ClusterAdmissionPolicy({});

    rootGetters = { currentCluster: { id: 'test-cluster' } };
    dispatch = jest.fn();
    Object.defineProperty(instance, '$rootGetters', { value: rootGetters });
    Object.defineProperty(instance, '$dispatch', { value: dispatch });

    instance.metadata = { labels: { 'helm.sh/chart': 'kubewarden-defaults-1.2.3' } };
  });

  describe('_availableActions getter', () => {
    it('filters out edit actions and adds editPolicySettings when isKubewardenDefaultPolicy is true and not deployed with fleet', () => {
      Object.defineProperty(instance, 'isKubewardenDefaultPolicy', { get: () => true });
      Object.defineProperty(instance, 'isDeployedWithFleet', { get: () => false });

      // Stub the parent (PolicyModel) _availableActions getter.
      const parentActions = [
        {
          action: 'goToEdit',
          label:  'Edit'
        },
        {
          action: 'goToEditYaml',
          label:  'Edit YAML'
        },
        {
          action: 'delete',
          label:  'Delete'
        }
      ];

      jest.spyOn(PolicyModel.prototype, '_availableActions', 'get').mockReturnValue(parentActions);

      const actions = instance._availableActions;

      // Verify that the default policy settings action is unshifted at the beginning.
      expect(actions[0]).toEqual({
        action: 'editPolicySettings',
        icon:   'icon icon-edit',
        label:  'Edit Policy Settings'
      });

      // And that actions do not include the filtered-out edit actions.
      actions.slice(1).forEach((action) => {
        expect(['goToEdit', 'goToEditYaml']).not.toContain(action.action);
      });
      // Verify that other actions (like 'delete') remain.
      expect(actions).toEqual(expect.arrayContaining([{
        action: 'delete',
        label:  'Delete'
      }]));
    });

    it('returns parent actions unchanged when isKubewardenDefaultPolicy is false', () => {
      Object.defineProperty(instance, 'isKubewardenDefaultPolicy', { get: () => false });
      // For this case, the condition isn’t met so we expect the parent's actions to pass through.
      const parentActions = [
        {
          action: 'goToEdit',
          label:  'Edit'
        },
        {
          action: 'delete',
          label:  'Delete'
        }
      ];

      jest.spyOn(PolicyModel.prototype, '_availableActions', 'get').mockReturnValue(parentActions);

      const actions = instance._availableActions;

      expect(actions).toEqual(parentActions);
    });
  });

  describe('editPolicySettings', () => {
    it('navigates to kubewardenDefaultsRoute if a valid route exists', () => {
      // Stub the kubewardenDefaultsRoute getter to return a valid route.
      const route = {
        name:   'route-name',
        params: { cluster: 'test-cluster' },
        query:  {}
      };

      jest.spyOn(instance, 'kubewardenDefaultsRoute', 'get').mockReturnValue(route);

      // Stub currentRouter to return a fake router with a push method.
      const push = jest.fn();

      instance.currentRouter = () => ({ push });

      instance.editPolicySettings();
      expect(push).toHaveBeenCalledWith(route);
    });

    it('logs an error if kubewardenDefaultsRoute is null', () => {
      // Stub the kubewardenDefaultsRoute getter to return null.
      jest.spyOn(instance, 'kubewardenDefaultsRoute', 'get').mockReturnValue(null);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      instance.editPolicySettings();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Could not determine the route to the Kubewarden Defaults chart.');
      consoleErrorSpy.mockRestore();
    });
  });
});
