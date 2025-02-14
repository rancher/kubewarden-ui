<script>
import jsyaml from 'js-yaml';
import { _CREATE, _EDIT, _CLONE } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';

import CruResource from '@shell/components/CruResource';

import { removeEmptyAttrs } from '../utils/object';
import { handleGrowl } from '../utils/handle-growl';

import Config from '../components/Policies/Config';
import Create from '../components/Policies/Create';

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
    CruResource, Config, Create
  },

  mixins: [CreateEditView],

  provide() {
    return { chartType: this.value.type, realMode: this.realMode };
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
        handleGrowl({ error: e, store: this.$store });
      }
    },

    // this updates the "value" obj for CAP's
    // with the updated values that came from the "edit YAML" scenario
    updateYamlValuesFromEdit(val) {
      const parsed = jsyaml.load(val);

      removeEmptyAttrs(parsed);
      Object.assign(this.value, parsed);
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