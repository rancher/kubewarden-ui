<template>
  <button
    class="btn role-primary scan-btn"
    :disabled="disableBtn"
    @click="startScan()"
  >
    <i class="icon icon-play"></i>
    {{ t('imageScanner.registries.button.startScan') || 'Enable' }}
  </button>
</template>

<script>
import { RESOURCE } from '@pkg/types';

export default {
  name:  'ScanButton',
  props: {
    // Element object -> { name: string, namespace: string }
    selectedRegistries: {
      type:    Array,
      default: () => []
    },
    reloadFn: {
      type:     Function,
      required: true
    },
  },
  methods: {
    async startScan() {
      if (!this.selectedRegistries || !this.selectedRegistries.length) {
        return;
      }
      this.selectedRegistries.forEach(async(registry) => {
        const scanjobObj = await this.$store.dispatch('cluster/create', {
          type:     RESOURCE.SCAN_JOB,
          metadata: {
            generateName: registry.name,
            namespace:    registry.namespace,
          },
          spec: { registry: registry.name }
        });

        try {
          await scanjobObj.save();
          this.$store.dispatch('growl/success', {
            title:   this.t('imageScanner.registries.messages.registryScanComplete'),
            message: this.t('imageScanner.registries.messages.registryScanComplete', { name: registry.name }),
          });
        } catch (e) {
          this.$store.dispatch('growl/error', {
            title:   this.t('imageScanner.registries.messages.registryScanFailed'),
            message: e.message,
          });
        } finally {
          this.reloadFn ? this.reloadFn() : null;
        }
      });
    },
  },
  computed: {
    disableBtn() {
      return !(this.selectedRegistries && this.selectedRegistries.length);
    },
  },
};
</script>

<style scoped>
.scan-btn {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
