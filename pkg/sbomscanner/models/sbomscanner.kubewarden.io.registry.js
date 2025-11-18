import SteveModel from '@shell/plugins/steve/steve-class';
import { PRODUCT_NAME, PAGE, RESOURCE } from '@sbomscanner/types';
export default class Registry extends SteveModel {
  get _availableActions() {
    // Remove the default actions we don't want
    const out = super._availableActions.filter((action) => !['showConfiguration', 'download', 'downloadYaml'].includes(action.action));

    // In details page, we don't want to show the scan action
    if (this.$rootState.targetRoute && this.$rootState.targetRoute.params && 'id' in this.$rootState.targetRoute.params) {
      return out;
    }

    const scanAction = {
      action:   'scanRegistry',
      label:    this.t('imageScanner.registries.button.startScan'),
      icon:     'icon icon-play',
      enabled:  true,
      bulkable: false,
      invoke:   async({}, res = []) => {
        const target = (res && res.length ? res[0] : res);
        const model = target._model || target;
        const scanjobObj = await this.$dispatch('create', {
          type:     RESOURCE.SCAN_JOB,
          metadata: {
            generateName: model.metadata.name,
            namespace:    model.metadata.namespace,
          },
          spec: { registry: model.metadata.name }
        });

        try {
          await scanjobObj.save();
          this.$dispatch('growl/success', {
            title:   this.$rootGetters['i18n/t']('imageScanner.registries.messages.registryScanComplete'),
            message: this.$rootGetters['i18n/t']('imageScanner.registries.messages.registryScanComplete', { name: model.metadata.name }),
          }, { root: true });
        } catch (e) {
          this.$dispatch('growl/error', {
            title:   this.$rootGetters['i18n/t']('imageScanner.registries.messages.registryScanFailed'),
            message: e.message,
          }, { root: true });
        }
      },
    };
    const divider = { divider: true };

    if (this.canEdit) {
      out.unshift(divider);
      out.unshift(scanAction);
    }

    return out;
  }

  get listLocation() {
    // if (this.$rootState.targetRoute.params.resource === "sbomscanner.kubewarden.io.registry") {
    //   return this._listLocation;
    // }
    return { name: `c-cluster-${ PRODUCT_NAME }-${ PAGE.REGISTRIES }` };
  }

  get doneOverride() {
    return this.listLocation;
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  get scanRec() {
    if (!this.id) {
      return null;
    }
    const scanJobs = this.$getters['all'](RESOURCE.SCAN_JOB).filter((scanjob) => `${ scanjob.metadata.namespace }/${ scanjob.spec.registry }` === this.id)
      // Sort the scanjob of the specific registry by the LastTransitionTime by descend order
      .sort((a, b) => {
        if (!a.status || !a.status.conditions || !Array.isArray(a.status.conditions) || a.status.conditions.length === 0) {
          return 1;
        }
        if (!b.status || !b.status.conditions || !Array.isArray(b.status.conditions) || b.status.conditions.length === 0) {
          return -1;
        }

        return this.getLastTransitionTime(b.status.conditions) - this.getLastTransitionTime(a.status.conditions);
      })
      // Take the latest 2 scanjobs
      .slice(0, 2);

    const status = scanJobs[0] ? scanJobs[0].statusResult?.type.toLowerCase() || 'pending' : 'none';
    const prevScanStatus = scanJobs[1] ? scanJobs[1].statusResult?.type.toLowerCase() || 'pending' : 'none';

    // Reform the record for the table
    const scanRec = {
      currStatus: status,
      progress:   {
        registryName:   this.metadata.name,
        progress:       scanJobs[0]?.statusResult?.progress || 0,
        progressDetail: `${ this.t('imageScanner.registries.configuration.scanTable.header.imagesScanned') }: ${ scanJobs[0] ? scanJobs[0].status?.scannedImagesCount : 0 } / ${ this.t('imageScanner.registries.configuration.scanTable.header.imagesFound') }: ${ scanJobs[0] ? scanJobs[0].status?.imagesCount : 0 }`,
        error:          scanJobs[0] && scanJobs[0].statusResult?.type.toLowerCase() === 'failed' ? scanJobs[0].statusResult.message : '',
      },
      previousScan: {
        prevScanStatus,
        prevProgress:       scanJobs[1]?.statusResult?.progress || 0,
        prevProgressDetail: `${ this.t('imageScanner.registries.configuration.scanTable.header.imagesScanned') }: ${ scanJobs[1] ? scanJobs[1].status?.scannedImagesCount : 0 } / ${ this.t('imageScanner.registries.configuration.scanTable.header.imagesFound') }: ${ scanJobs[1] ? scanJobs[1].status?.imagesCount : 0 }`,
        prevError:          scanJobs[1] && scanJobs[1].statusResult?.type.toLowerCase() === 'failed' ? scanJobs[1].statusResult.message : '',
      },
      previousStatus:     this.getPreviousStatus(scanJobs),
      lastTransitionTime: scanJobs[0] && scanJobs[0].statusResult?.lastTransitionTime ? scanJobs[0].statusResult.lastTransitionTime : null,
      completionTime:     scanJobs[0] && scanJobs[0].status?.completionTime ? scanJobs[0] && scanJobs[0].status.completionTime : null,
    };

    return scanRec;
  }

  getPreviousStatus(scanjobs) {
    if (scanjobs && scanjobs[0] && scanjobs[0].status && scanjobs[0].statusResult && scanjobs[0].statusResult.statusIndex > 0) {
      const index = scanjobs[0].statusResult.statusIndex;

      if (index < 3) {
        return scanjobs[0].status?.conditions ? scanjobs[0].status.conditions[index - 1].type.toLowerCase() : 'none';
      } else {
        return scanjobs[0].status?.conditions ? scanjobs[0].status.conditions[index - 2].type.toLowerCase() : 'none';
      }
    } else if (scanjobs && scanjobs[1]) {
      return scanjobs[1].statusResult?.type.toLowerCase();
    } else {
      return 'none';
    }
  }

  getLastTransitionTime(conditions) {
    let lastTransitionTime = 0;

    conditions.forEach((condition) => {
      lastTransitionTime = Math.max(lastTransitionTime, new Date(condition.lastTransitionTime).getTime());
    });

    return lastTransitionTime;
  }

  async fetchSecondaryResources({ canPaginate }) {
    if (canPaginate) {
      return;
    }

    return await this.$store.dispatch(`cluster/findAll`, { type: RESOURCE.SCAN_JOB });
  }
}
