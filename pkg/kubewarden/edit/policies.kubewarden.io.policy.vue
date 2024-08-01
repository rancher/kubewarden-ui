<script>
import jsyaml from 'js-yaml';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';

import { removeEmptyAttrs } from '../utils/object';
import { handleGrowl } from '../utils/handle-growl';

import Create from '../components/Policies/Create';

export default {
  name: 'AdmissionPolicy',

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

  components: { Create },

  mixins: [CreateEditView],

  provide() {
    return { realMode: this.realMode };
  },

  computed: {
    isCreate() {
      return this.realMode === _CREATE;
    },
  },

  methods: {
    async finish(event) {
      try {
        removeEmptyAttrs(this.value);

        console.log('## finish event', event);

        await this.save(event);
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
  <Create :value="value" :mode="mode" />
</template>
