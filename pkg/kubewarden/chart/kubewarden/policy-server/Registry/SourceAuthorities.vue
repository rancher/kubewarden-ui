<script>
import { _VIEW } from '@shell/config/query-params';
import { isEmpty } from '@shell/utils/object';

import Authority from './Authority';

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
    if ( this.value ) {
      for ( const [key, value] of Object.entries(this.value) ) {
        this.rows.push({
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
        registryName: '',
        certs:        []
      });
    },

    deleteAuthority(index) {
      if ( !isEmpty(this.value) ) {
        const key = Object.keys(this.value)[index];

        this.$delete(this.value, [key]);
      }
    },

    removeRegistry(index) {
      this.rows.splice(index, 1);
      this.deleteAuthority(index);
    },

    updateAuthority(event, index) {
      const { registryName, certs } = event;

      if ( !isEmpty(this.value) ) {
        this.deleteAuthority(index);
      }

      this.value[registryName] = certs || [];
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
      <template v-for="(row, index) in rows" :key="index">
        <Authority ref="authority" v-model:value="rows[index]" :mode="mode" @update="updateAuthority($event, index)">
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
