import SteveModel from '@shell/plugins/steve/steve-class';
import { PRODUCT_NAME, PAGE } from '@sbomscanner/types';

export default class SbomscannerRancherIoVexhub extends SteveModel {
  get _availableActions() {
    let out = super._availableActions || [];

    // Check if we are in the details page
    const isDetailsPage = this.$rootState.targetRoute && 'id' in this.$rootState.targetRoute.params;

    // Remove download actions and View in API, keep edit YAML and clone
    const remove = new Set([
      'download',
      'downloadYaml',
      'downloadyaml',
      'viewInApi',
      'showConfiguration',
    ]);

    out = out.filter((a) => !a?.action || !remove.has(a.action));

    // Customize the edit action label
    out = out.map((action) => {
      // Check for various possible edit action names
      if (action?.action === 'edit' || action?.action === 'goToEdit' || action?.action === 'editConfiguration') {
        return {
          ...action,
          label: this.t('imageScanner.vexManagement.buttons.editConfiguration') || 'Edit configuration'
        };
      } else if (action?.action === 'view' || action?.action === 'goToView' || action?.action === 'viewConfiguration') {
        return {
          ...action,
          label: this.t('imageScanner.vexManagement.buttons.viewConfiguration') || 'View configuration'
        };
      }

      return action;
    });

    const isEnabled = !!this.spec?.enabled;
    const toggle = this.toggle;

    if (isEnabled) {
      // For enabled items: Disable, then other actions
      const reordered = super.canEdit ? [toggle] : []; // Only the disable action

      // Add other actions except delete (which goes last)
      const otherActions = out.filter((a) => a && (a.action !== 'promptRemove' && (a.action !== 'goToClone' || super.canEdit)));

      reordered.push(...otherActions);

      // Add delete at the end
      const deleteAction = out.find((a) => a?.action === 'promptRemove');

      if (deleteAction && this.canDelete) {
        reordered.push(deleteAction);
      }

      // Ensure all actions are enabled
      const returnActions = reordered.map((action) => {
        if (action && action.enabled === false) {
          return { ...action, enabled: true };
        }

        return action;
      });

      return isDetailsPage ? returnActions.slice(1) : returnActions;
    }

    // When disabled: Enable, then Delete
    const cloneAction = out.find((a) => a?.action === 'goToClone');
    const returnActions = [...(super.canEdit ? [toggle] : []), ...(cloneAction && super.canEdit ? [cloneAction] : [])];

    if (returnActions.length === 0) {
      returnActions.push({
        label:  this.t('imageScanner.general.noActions'),
        enable: false,
        action: null,
      });
    }

    return isDetailsPage ? returnActions.slice(1) : returnActions;
  }

  get canDelete() {
    return this.spec?.enabled && super.canDelete;
  }

  get toggle() {
    const isEnabled = !!this.spec?.enabled;

    if (isEnabled) {
      return {
        action:   'disable',
        label:    this.t('imageScanner.vexManagement.buttons.disable') || 'Disable',
        icon:     'icon icon-pause',
        enabled:  true,
        bulkable: true,
        invoke:   async(_, resources = []) => {
          // Handle bulk action - process all selected resources
          if (resources && resources.length > 1) {
            // Bulk operation
            await Promise.all(resources.map(async(resource) => {
              if (resource.spec) {
                resource.spec = { ...(resource.spec || {}), enabled: false };
                await resource.save();
              }
            }));
          } else {
            // Single resource operation
            this.spec = { ...(this.spec || {}), enabled: false };
            await this.save();
          }
        }
      };
    } else {
      return {
        action:   'enable',
        label:    this.t('imageScanner.vexManagement.buttons.enable') || 'Enable',
        icon:     'icon-play',
        enabled:  true,
        bulkable: true,
        invoke:   async(_, resources = []) => {
          // Handle bulk action - process all selected resources
          if (resources && resources.length > 1) {
            // Bulk operation
            await Promise.all(resources.map(async(resource) => {
              if (resource.spec) {
                resource.spec = { ...(resource.spec || {}), enabled: true };
                await resource.save();
              }
            }));
          } else {
            // Single resource operation
            this.spec = { ...(this.spec || {}), enabled: true };
            await this.save();
          }
        }
      };
    }
  }

  get listLocation() {
    // if (this.$rootState.targetRoute.params.resource === "sbomscanner.kubewarden.io.vexhub") {
    //   return this._listLocation;
    // }
    return { name: `c-cluster-${ PRODUCT_NAME }-${ PAGE.VEX_MANAGEMENT }` };
  }

  get doneOverride() {
    return this.listLocation;
  }

  get parentLocationOverride() {
    return this.listLocation;
  }
}
