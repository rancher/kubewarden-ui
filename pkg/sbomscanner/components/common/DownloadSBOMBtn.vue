<template>
  <button
    class="btn role-secondary"
    aria-label="Download SBOM"
    type="button"
    @click="downloadSBOM"
  >
    <i class="icon icon-download"></i>&nbsp;
    {{ t('imageScanner.images.downloadSBOM') }}
  </button>
</template>

<script>
import day from 'dayjs';
import { downloadJSON } from '@sbomscanner/utils/report';
export default {
  name:  'DownloadSBOMBtn',
  props: {
    sbom: {
      type:    Object,
      default: null,
    },
    imageName: {
      type:    String,
      default: '',
    },
  },
  methods: {
    // Download methods
    downloadSBOM() {
      try {
        if (!this.sbom) {
          this.$store.dispatch('growl/error', {
            title:   'Error',
            message: 'No SBOM data available for download'
          }, { root: true });

          return;
        }
        // Generate SBOM download
        const sbomData = JSON.stringify(this.sbom.spdx, null, 2);

        downloadJSON(sbomData, `${ this.imageName }-sbom_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.spdx.json`);

        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'SBOM downloaded successfully'
        }, { root: true });
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download SBOM'
        }, { root: true });
      }
    },
  },
};
</script>

<style lang="scss" scoped>

</style>
