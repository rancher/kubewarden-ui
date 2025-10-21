import SteveModel from '@shell/plugins/steve/steve-class';

export default class Scanjob extends SteveModel {
  get statusResult() {
    let statusResult = null;
    const status = this.status || {};

    if (!this.status) { // A extreme corner case, the scanner created a job without status object
      statusResult = {
        type:               'Pending',
        lastTransitionTime: null,
        statusIndex:        -1,
        progress:           0
      };
    }
    const statusIndex = this.status?.conditions?.findIndex((condition) => {
      return condition.status === 'True';
    });

    statusResult = statusIndex > -1 ? {
      type:               this.status.conditions[statusIndex].type,
      lastTransitionTime: new Date(this.status.conditions[statusIndex].lastTransitionTime).getTime(),
      message:            this.status.conditions[statusIndex].message,
      statusIndex,
      progress:           status.imagesCount && status.scannedImagesCount ? Math.ceil(status.scannedImagesCount / status.imagesCount * 100) : 0
    } : {
      type:               'Pending',
      lastTransitionTime: null,
      statusIndex:        -1,
      progress:           0
    };

    return statusResult;
  }
}
