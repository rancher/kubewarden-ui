import SteveModel from '@shell/plugins/steve/steve-class';

export default class Scanjob extends SteveModel {
  get statusResult() {
    const status = this.status || {};

    if (!this.status) {
      return {
        type:               'Pending',
        lastTransitionTime: null,
        statusIndex:        -1,
        progress:           0
      };
    }

    const statusIndex = this.status.conditions?.findIndex((condition) => condition.status === 'True') || -1;

    if (statusIndex > -1) {
      return {
        type:               this.status.conditions[statusIndex].type,
        lastTransitionTime: new Date(this.status.conditions[statusIndex].lastTransitionTime).getTime(),
        message:            this.status.conditions[statusIndex].message,
        statusIndex,
        progress:           status.imagesCount && status.scannedImagesCount ? Math.ceil((status.scannedImagesCount / status.imagesCount) * 100) : 0
      };
    }

    return {
      type:               'Pending',
      lastTransitionTime: null,
      statusIndex:        -1,
      progress:           0
    };
  }
}
