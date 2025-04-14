<script>
import { _CLONE, _CREATE, _EDIT } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';
import jsyaml from 'js-yaml';

import { handleGrowl } from '@kubewarden/utils/handle-growl';
import { removeEmptyAttrs } from '@kubewarden/utils/object';
import CruResource from '@shell/components/CruResource';

import Config from '@kubewarden/components/Policies/Config';
import Create from '@kubewarden/components/Policies/Create';

export default {
  name: 'ClusterAdmissionPolicy',

  props: {
    value: {
      type:     Object,
      required: true
    },

    mode: {
      type:    String,
      default: _EDIT
    },

    realMode: {
      type:    String,
      default: _EDIT
    }
  },

  components: {
    CruResource,
    Config,
    Create
  },

  mixins: [CreateEditView],

  provide() {
    return {
      chartType: this.value.type,
      realMode:  this.realMode
    };
  },

  computed: {
    isCreate() {
      return this.realMode === _CREATE;
    },

    isClone() {
      return this.realMode === _CLONE;
    },

    schema() {
      return this.$store.getters['cluster/schemaFor'](this.value.type);
    }
  },

  methods: {
    async finish(event) {
      try {
        removeEmptyAttrs(this.value);

        // remove metadata that identifies a CAP as a default policy, so that we can edit it later on the UI
        // https://github.com/rancher/kubewarden-ui/issues/682
        if (
          this.isClone &&
          this.value.isKubewardenDefaultPolicy &&
          this.value?.metadata?.labels?.['app.kubernetes.io/name'] === 'kubewarden-defaults'
        ) {
          delete this.value?.metadata?.labels?.['app.kubernetes.io/name'];
        }

        await this.save(event, (this.schema?.linkFor('collection') || ''));
      } catch (e) {
        handleGrowl({
          error: e,
          store: this.$store
        });
      }
    },

    // this updates the "value" obj for CAP's
    // with the updated values that came from the "edit YAML" scenario
    updateYamlValuesFromEdit(val) {
      // Parse the YAML input and remove any empty attributes.
      const parsed = jsyaml.load(val);

      removeEmptyAttrs(parsed);

      /*
       * We update the contents of this.value in place instead of replacing it with a new object.
       *
       * The reason for this is that the CreateEditView mixin directly works with the object
       * referenced by this.value. Replacing the object (e.g., using `this.value = { ...parsed }`)
       * would break that reference and prevent the mixin from observing the updated properties.
       *
       * Instead, we:
       *   1. Delete any properties from this.value that no longer exist in the parsed object.
       *   2. Merge the parsed object's properties into the existing this.value using Object.assign.
       *
       * See issue https://github.com/rancher/kubewarden-ui/issues/1155
       */
      Object.keys(this.value).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(parsed, key)) {
          delete this.value[key];
        }
      });

      Object.assign(this.value, parsed);

      // Emit the updated object to inform the parent/component using v-model that a change has occurred.
      this.$emit('input', this.value);
    }
  }
};
</script>



<template>
  <Create v-if="isCreate" :value="value" :mode="mode" />
  <CruResource
    v-else
    :errors="errors"
    :resource="value"
    :mode="realMode"
    :can-yaml="false"
    @finish="finish"
  >
    <Config
      :value="value"
      :mode="realMode"
      @updateYamlValues="updateYamlValuesFromEdit"
    />
  </CruResource>
</template>

<style lang="scss" scoped>
:deep(.cru__footer) {
  z-index: 1;
}
</style>
