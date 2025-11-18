import SteveModel from '@shell/plugins/steve/steve-class';
import { PRODUCT_NAME, PAGE } from '@sbomscanner/types';

export default class SBOM extends SteveModel {
  get _availableActions() {
    const out = super._availableActions || [];

    // Remove download actions and View in API, keep edit YAML and clone
    const remove = new Set([
      'download',
      'downloadYaml',
      'downloadyaml',
      'viewYaml',
      'goToViewYaml',
      'viewInApi',
      'showConfiguration',
    ]);

    return out.filter((a) => !a?.action || !remove.has(a.action));
  }

  get listLocation() {
    return { name: `c-cluster-${ PRODUCT_NAME }-${ PAGE.IMAGES }` };
  }

  get doneOverride() {
    return this.listLocation;
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  // Get parsed SPDX data
  get spdxData() {
    if (!this.spec?.spdx) return null;

    try {
      return typeof this.spec.spdx === 'string' ? JSON.parse(this.spec.spdx) : this.spec.spdx;
    } catch (error) {
      return null;
    }
  }

  // Get packages from SPDX data
  get packages() {
    const data = this.spdxData;

    return data?.packages || [];
  }

  // Get document information
  get documentInfo() {
    const data = this.spdxData;

    return data?.documentDescribes || [];
  }

  // Get creation info
  get creationInfo() {
    const data = this.spdxData;

    return data?.creationInfo || {};
  }

  // Get associated image
  get associatedImage() {
    if (!this.spec?.image) return null;

    const images = this.$getters['all'](this.$rootGetters['i18n/t']('imageScanner.resources.image'));

    return images.find((image) => image.metadata?.name === this.spec.image ||
      image.spec?.name === this.spec.image
    );
  }

  // Get package count
  get packageCount() {
    return this.packages.length;
  }

  // Get license information
  get licenseInfo() {
    const data = this.spdxData;

    return data?.creationInfo?.licenseListVersion || 'Unknown';
  }
}
