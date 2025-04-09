import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import { KUBERNETES, WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';

import { KUBEWARDEN_CHARTS, KUBEWARDEN_PRODUCT_NAME, KUBEWARDEN_ANNOTATIONS } from '@kubewarden/types';

import PolicyModel from '@kubewarden/plugins/policy-class';
import KubewardenModel from '@kubewarden/plugins/kubewarden-class';

describe('PolicyModel', () => {
  let instance: PolicyModel;
  let rootGetters: Record<string, any>;
  let dispatch: jest.Mock;

  beforeEach(() => {
    // Pass a mock data object to avoid errors in parent constructor.
    instance = new PolicyModel({});

    // Override read-only Vuex properties using Object.defineProperty.
    rootGetters = { currentCluster: { id: 'cluster-id' } };
    dispatch = jest.fn();

    Object.defineProperty(instance, '$rootGetters', { value: rootGetters });
    Object.defineProperty(instance, '$dispatch', { value: dispatch });

    // Reset metadata, spec, and status
    instance.metadata = {};
    instance.spec = {};
    instance.status = {};
  });

  describe('_availableActions', () => {
    let parentActionsSpy: jest.SpyInstance<any, []>;
    const mockAction = {
      action:  'mock',
      label:   'Mock',
      icon:    'mock-icon',
      enabled: true
    };

    afterEach(() => {
      if (parentActionsSpy) {
        parentActionsSpy.mockRestore();
      }
    });

    it('should prepend policy mode action when spec.mode is "monitor" and not deployed with fleet', () => {
      // Simulate parent's _availableActions getter returning an array.
      parentActionsSpy = jest.spyOn(KubewardenModel.prototype, '_availableActions', 'get').mockReturnValue([mockAction]);

      instance.spec.mode = 'monitor';
      // Ensure not deployed with fleet.
      instance.metadata.annotations = {};

      const actions = instance._availableActions;

      expect(actions[0]).toMatchObject({
        action:  'toggleUpdateMode',
        enabled: true,
        label:   'Update Mode',
        icon:    'icon icon-fw icon-notifier'
      });
      // Ensure the parent's action is still included.
      expect(actions).toEqual(expect.arrayContaining([mockAction]));
    });

    it('should filter out fleet actions when deployed with fleet', () => {
      parentActionsSpy = jest.spyOn(KubewardenModel.prototype, '_availableActions', 'get').mockReturnValue([
        {
          action: 'goToEdit',
          label:  'Edit'
        },
        {
          action: 'toggleUpdateMode',
          label:  'Update Mode'
        },
        {
          action: 'other',
          label:  'Other'
        }
      ]);

      // Simulate deployment with fleet by setting the workspace annotation.
      instance.metadata.annotations = { [WORKSPACE_ANNOTATION]: 'some-workspace' };
      instance.spec.mode = 'monitor';

      const actions = instance._availableActions;
      const actionKeys = actions.map((a) => a.action);

      // These actions should be filtered out.
      expect(actionKeys).not.toContain('goToEdit');
      expect(actionKeys).not.toContain('toggleUpdateMode');
      // Other actions should remain.
      expect(actionKeys).toContain('other');
    });
  });

  describe('kubewardenDefaultsRoute', () => {
    it('returns route object when helmChart is present with valid semver', () => {
      instance.metadata.labels = { 'helm.sh/chart': 'kubewarden-defaults-1.2.3' };

      const route = instance.kubewardenDefaultsRoute;
      const expectedQuery = {
        [REPO_TYPE]: 'cluster',
        [REPO]:      'kubewarden-charts',
        [CHART]:     'kubewarden-defaults',
        [VERSION]:   '1.2.3'
      };

      expect(route).toEqual({
        name:   'c-cluster-apps-charts-install',
        params: { cluster: 'cluster-id' },
        query:  expectedQuery
      });
    });

    it('returns null when helmChart is not present', () => {
      instance.metadata.labels = {};
      expect(instance.kubewardenDefaultsRoute).toBeNull();
    });
  });

  describe('isKubewardenDefaultPolicy', () => {
    it('returns true when labels match Helm management, defaults, and part-of', () => {
      instance.metadata.labels = {
        [KUBERNETES.MANAGED_BY]:     'Helm',
        [KUBERNETES.MANAGED_NAME]:   KUBEWARDEN_CHARTS.DEFAULTS,
        'app.kubernetes.io/part-of': KUBEWARDEN_PRODUCT_NAME
      };
      expect(instance.isKubewardenDefaultPolicy).toBe(true);
    });

    it('returns false when one label does not match', () => {
      instance.metadata.labels = {
        [KUBERNETES.MANAGED_BY]:     'Helm',
        [KUBERNETES.MANAGED_NAME]:   'not-default',
        'app.kubernetes.io/part-of': KUBEWARDEN_PRODUCT_NAME
      };
      expect(instance.isKubewardenDefaultPolicy).toBe(false);
    });
  });

  describe('isDeployedWithFleet', () => {
    it('returns truthy when WORKSPACE_ANNOTATION exists and applied annotation is missing', () => {
      instance.metadata.annotations = { [WORKSPACE_ANNOTATION]: 'workspace-value' };
      expect(instance.isDeployedWithFleet).toBeTruthy();
    });

    it('returns falsy when applied annotation exists', () => {
      instance.metadata.annotations = {
        [WORKSPACE_ANNOTATION]:            'workspace-value',
        'objectset.rio.cattle.io/applied': 'something'
      };
      expect(instance.isDeployedWithFleet).toBeFalsy();
    });
  });

  describe('isApplied', () => {
    it('returns the applied annotation value', () => {
      instance.metadata.annotations = { 'objectset.rio.cattle.io/applied': 'applied-value' };
      expect(instance.isApplied).toBe('applied-value');
    });
  });

  describe('source', () => {
    it('returns "kubewarden-defaults" when policy is default, not deployed with fleet, and not applied', () => {
      instance.metadata.labels = {
        [KUBERNETES.MANAGED_BY]:     'Helm',
        [KUBERNETES.MANAGED_NAME]:   KUBEWARDEN_CHARTS.DEFAULTS,
        'app.kubernetes.io/part-of': KUBEWARDEN_PRODUCT_NAME
      };
      instance.metadata.annotations = {}; // not deployed with fleet, not applied
      expect(instance.source).toBe('kubewarden-defaults');
    });

    it('returns "Fleet" when deployed with fleet and not applied', () => {
      instance.metadata.annotations = {
        [WORKSPACE_ANNOTATION]:            'workspace-value',
        'objectset.rio.cattle.io/applied': ''
      };
      // Even if default labels are present, deployment with fleet takes precedence.
      instance.metadata.labels = {
        [KUBERNETES.MANAGED_BY]:     'Helm',
        [KUBERNETES.MANAGED_NAME]:   KUBEWARDEN_CHARTS.DEFAULTS,
        'app.kubernetes.io/part-of': KUBEWARDEN_PRODUCT_NAME
      };
      expect(instance.source).toBe('Fleet');
    });

    it('returns "Policy Catalog" when Helm chart annotations is present', () => {
      instance.metadata.annotations = { [KUBEWARDEN_ANNOTATIONS.CHART_KEY]: 'some-chart' };
      expect(instance.source).toBe('Policy Catalog');
    });

    it('returns "Custom" when artifacthub/pkg annotation is present', () => {
      instance.metadata.annotations = { 'artifacthub/pkg': 'some-pkg' };
      expect(instance.source).toBe('Custom');
    });

    it('returns "Custom" by default', () => {
      instance.metadata.annotations = {};
      instance.metadata.labels = {};
      expect(instance.source).toBe('Custom');
    });
  });
});
