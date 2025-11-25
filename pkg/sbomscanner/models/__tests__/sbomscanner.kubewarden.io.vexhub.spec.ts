import { jest } from '@jest/globals';
import SteveModel from '@shell/plugins/steve/steve-class';
import SbomscannerRancherIoVexhub from '../sbomscanner.kubewarden.io.vexhub.js';
import { PRODUCT_NAME, PAGE } from '@sbomscanner/types';

jest.mock('@shell/plugins/steve/steve-class', () => {
  const MockSteveModel = class {
    constructor() {
      this.spec = {};
      this.metadata = {};
      this.save = jest.fn();
      this.t = jest.fn((key) => key);
      this.$rootState = { targetRoute: { params: {} } };
    }

    get _availableActions() {
      return [
        { action: 'edit', label: 'Edit' },
        { action: 'view', label: 'View' },
        { action: 'download', label: 'Download' },
        { action: 'downloadYaml', label: 'Download YAML' },
        { action: 'viewInApi', label: 'View in API' },
        { action: 'goToClone', label: 'Clone' },
        { action: 'promptRemove', label: 'Delete' },
      ];
    }

    get canDelete() {
      return true;
    }

    get canEdit() {
      return true;
    }
  };

  return {
    __esModule: true,
    default:    MockSteveModel
  };
});

jest.mock('@sbomscanner/types', () => ({
  PRODUCT_NAME: 'test-product',
  PAGE:         { VEX_MANAGEMENT: 'test-page-vex' }
}));

describe('SbomscannerRancherIoVexhub', () => {
  let wrapper;
  let superSpy;

  const baseActions = [
    { action: 'edit', label: 'Edit' },
    { action: 'view', label: 'View' },
    { action: 'download', label: 'Download' },
    { action: 'downloadYaml', label: 'Download YAML' },
    { action: 'viewInApi', label: 'View in API' },
    { action: 'goToClone', label: 'Clone' },
    { action: 'promptRemove', label: 'Delete' },
  ];

  beforeEach(() => {
    wrapper = new SbomscannerRancherIoVexhub();
    jest.clearAllMocks();

    superSpy = {
      _availableActions: jest.spyOn(SteveModel.prototype, '_availableActions', 'get'),
      canDelete:         jest.spyOn(SteveModel.prototype, 'canDelete', 'get'),
      canEdit:           jest.spyOn(SteveModel.prototype, 'canEdit', 'get'),
    };

    superSpy._availableActions.mockReturnValue(baseActions);
    superSpy.canDelete.mockReturnValue(true);
    superSpy.canEdit.mockReturnValue(true);

    wrapper.$rootState.targetRoute.params = {};
  });

  describe('getters', () => {
    it('should return correct listLocation', () => {
      expect(wrapper.listLocation).toEqual({ name: `c-cluster-${ PRODUCT_NAME }-${ PAGE.VEX_MANAGEMENT }` });
      expect(wrapper.listLocation).toEqual({ name: 'c-cluster-test-product-test-page-vex' });
    });

    it('should return listLocation for doneOverride', () => {
      expect(wrapper.doneOverride).toStrictEqual(wrapper.listLocation);
    });

    it('should return listLocation for parentLocationOverride', () => {
      expect(wrapper.parentLocationOverride).toStrictEqual(wrapper.listLocation);
    });

    describe('canDelete', () => {
      it('should be true if enabled and super.canDelete is true', () => {
        wrapper.spec = { enabled: true };
        superSpy.canDelete.mockReturnValue(true);
        expect(wrapper.canDelete).toBe(true);
      });

      it('should be false if disabled', () => {
        wrapper.spec = { enabled: false };
        superSpy.canDelete.mockReturnValue(true);
        expect(wrapper.canDelete).toBe(false);
      });

      it('should be false if super.canDelete is false', () => {
        wrapper.spec = { enabled: true };
        superSpy.canDelete.mockReturnValue(false);
        expect(wrapper.canDelete).toBe(false);
      });
    });
  });

  describe('toggle', () => {
    describe('when disabled', () => {
      beforeEach(() => {
        wrapper.spec = { enabled: false };
      });

      it('should return an "enable" action', () => {
        const action = wrapper.toggle;

        expect(action.action).toBe('enable');
        expect(action.label).toBe('imageScanner.vexManagement.buttons.enable');
        expect(action.icon).toBe('icon-play');
        expect(action.enabled).toBe(true);
        expect(action.bulkable).toBe(true);
      });

      it('invoke should set enabled to true and save (single)', async() => {
        await wrapper.toggle.invoke();

        expect(wrapper.spec.enabled).toBe(true);
        expect(wrapper.save).toHaveBeenCalledTimes(1);
      });

      it('invoke should set enabled to true and save (bulk)', async() => {
        const res1 = { spec: { enabled: false }, save: jest.fn() };
        const res2 = { spec: { enabled: false }, save: jest.fn() };

        await wrapper.toggle.invoke(null, [res1, res2]);

        expect(res1.spec.enabled).toBe(true);
        expect(res1.save).toHaveBeenCalledTimes(1);
        expect(res2.spec.enabled).toBe(true);
        expect(res2.save).toHaveBeenCalledTimes(1);
        expect(wrapper.save).not.toHaveBeenCalled();
      });
    });

    describe('when enabled', () => {
      beforeEach(() => {
        wrapper.spec = { enabled: true };
      });

      it('should return a "disable" action', () => {
        const action = wrapper.toggle;

        expect(action.action).toBe('disable');
        expect(action.label).toBe('imageScanner.vexManagement.buttons.disable');
        expect(action.icon).toBe('icon icon-pause');
        expect(action.enabled).toBe(true);
        expect(action.bulkable).toBe(true);
      });

      it('invoke should set enabled to false and save (single)', async() => {
        await wrapper.toggle.invoke();

        expect(wrapper.spec.enabled).toBe(false);
        expect(wrapper.save).toHaveBeenCalledTimes(1);
      });

      it('invoke should set enabled to false and save (bulk)', async() => {
        const res1 = { spec: { enabled: true }, save: jest.fn() };
        const res2 = { spec: { enabled: true }, save: jest.fn() };

        await wrapper.toggle.invoke(null, [res1, res2]);

        expect(res1.spec.enabled).toBe(false);
        expect(res1.save).toHaveBeenCalledTimes(1);
        expect(res2.spec.enabled).toBe(false);
        expect(res2.save).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('_availableActions', () => {
    it('should filter out download and viewInApi actions', () => {
      wrapper.spec = { enabled: true };
      const actions = wrapper._availableActions;
      const actionNames = actions.map((a) => a.action);

      expect(actionNames).not.toContain('download');
      expect(actionNames).not.toContain('downloadYaml');
      expect(actionNames).not.toContain('viewInApi');
      expect(actionNames).toContain('edit');
      expect(actionNames).toContain('goToClone');
    });

    it('should customize labels for edit and view actions', () => {
      wrapper.spec = { enabled: true };
      const actions = wrapper._availableActions;
      const editAction = actions.find((a) => a.action === 'edit');
      const viewAction = actions.find((a) => a.action === 'view');

      expect(editAction.label).toBe('imageScanner.vexManagement.buttons.editConfiguration');
      expect(viewAction.label).toBe('imageScanner.vexManagement.buttons.viewConfiguration');
    });

    describe('when enabled', () => {
      beforeEach(() => {
        wrapper.spec = { enabled: true };
      });

      it('should order actions as disable, others, delete', () => {
        const actions = wrapper._availableActions;
        const actionNames = actions.map((a) => a?.action);

        expect(actionNames[0]).toBe('disable');
        expect(actionNames).toContain('edit');
        expect(actionNames).toContain('view');
        expect(actionNames).toContain('goToClone');
        expect(actionNames[actionNames.length - 1]).toBe('promptRemove');
      });

      it('should not include disable or clone if canEdit is false', () => {
        superSpy.canEdit.mockReturnValue(false);
        const actions = wrapper._availableActions;
        const actionNames = actions.map((a) => a?.action);

        expect(actionNames).not.toContain('disable');
        expect(actionNames).not.toContain('goToClone');
        expect(actionNames[0]).toBe('edit');
      });

      it('should not include delete if canDelete is false', () => {
        superSpy.canDelete.mockReturnValue(false);
        const actions = wrapper._availableActions;
        const actionNames = actions.map((a) => a?.action);

        expect(actionNames).not.toContain('promptRemove');
      });

      it('should remove the first action (disable) on details page', () => {
        wrapper.$rootState.targetRoute.params = { id: 'some-id' };
        const actions = wrapper._availableActions;
        const actionNames = actions.map((a) => a?.action);

        expect(actionNames[0]).not.toBe('disable');
        expect(actionNames[0]).toBe('edit');
      });

      it('should ensure all actions are enabled', () => {
        const mockDisabledEditAction = {
          action: 'edit', label: 'Edit', enabled: false
        };

        superSpy._availableActions.mockReturnValue([
          mockDisabledEditAction
        ]);

        const actions = wrapper._availableActions;

        const disableAction = actions.find((a) => a.action === 'disable');

        expect(disableAction).toBeDefined();
        expect(disableAction.enabled).toBe(true);

        const editAction = actions.find((a) => a.action === 'edit');

        expect(editAction).toBeDefined();
        expect(editAction.enabled).toBe(true);
      });
    });

    describe('when disabled', () => {
      beforeEach(() => {
        wrapper.spec = { enabled: false };
      });

      it('should only include "enable" and "clone" actions', () => {
        const actions = wrapper._availableActions;
        const actionNames = actions.map((a) => a?.action);

        expect(actionNames).toEqual(['enable', 'goToClone']);
      });

      it('should return "noActions" if cannot edit', () => {
        superSpy.canEdit.mockReturnValue(false);
        const actions = wrapper._availableActions;

        expect(actions.length).toBe(1);
        expect(actions[0].action).toBeNull();
        expect(actions[0].label).toBe('imageScanner.general.noActions');
      });

      it('should remove the first action (enable) on details page', () => {
        wrapper.$rootState.targetRoute.params = { id: 'some-id' };
        const actions = wrapper._availableActions;
        const actionNames = actions.map((a) => a?.action);

        expect(actionNames).toEqual(['goToClone']);
      });

      it('should return no actions on details page if cannot edit', () => {
        wrapper.$rootState.targetRoute.params = { id: 'some-id' };
        superSpy.canEdit.mockReturnValue(false);
        const actions = wrapper._availableActions;

        expect(actions.length).toBe(0);
      });
    });
  });
});
