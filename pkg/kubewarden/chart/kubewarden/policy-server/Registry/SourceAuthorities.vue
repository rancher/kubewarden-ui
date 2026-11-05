<script>
import { _VIEW } from '@shell/config/query-params';

import Authority from './Authority';

// Stable row ids, so v-for does not reuse Authority components by index
let rowId = 0;

export default {
  props: {
    mode: {
      type:    String,
      default: _VIEW
    },

    // chartValues.spec.sourceAuthorities
    value: {
      type:     [Array, Object],
      default:  () => {
        return {};
      }
    }
  },

  components: { Authority },

  fetch() {
    if (this.value) {
      for (const [key, value] of Object.entries(this.value)) {
        this.rows.push({
          id:           rowId++,
          registryName: key,
          certs:        value
        });
      }
    } else {
      this.value = {};
    }
  },

  data() {
    return { rows: [] };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    addRegistry() {
      this.rows.push({
        id:           rowId++,
        registryName: '',
        certs:        []
      });
    },

    removeRegistry(index) {
      this.rows.splice(index, 1);
      this.syncValue();
    },

    // Rebuild value from rows in place, the parent keeps a reference to this object
    syncValue() {
      Object.keys(this.value).forEach((key) => delete this.value[key]);

      this.rows.forEach(({ registryName, certs }) => {
        if (registryName) {
          this.value[registryName] = certs || [];
        }
      });

      this.$emit('update', this.value);
    }
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-12">
      <h3 data-testid="ps-config-source-authorities-title">
        {{ t('kubewarden.policyServerConfig.sourceAuthorities.title') }}
      </h3>
      <template v-for="(row, index) in rows" :key="row.id">
        <Authority ref="authority" v-model:value="rows[index]" :mode="mode" @update="syncValue">
          <template #remove>
            <button
              :data-testid="`ps-config-authority-remove-button-${ index }`"
              type="button"
              :disabled="isView"
              class="btn role-link remove btn-sm"
              @click="removeRegistry(index)"
            >
              <i class="icon icon-2x icon-x" />
            </button>
          </template>
        </Authority>
      </template>

      <button
        data-testid="ps-config-source-authorities-add-button"
        type="button"
        class="btn role-tertiary add"
        :disabled="isView"
        @click="addRegistry()"
      >
        {{ t('kubewarden.policyServerConfig.sourceAuthorities.add') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.remove {
  position: absolute;
  padding: 0px;
  top: 0;
  right: 0;
}
</style>
