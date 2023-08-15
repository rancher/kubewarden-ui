<script>
import { _CREATE, _EDIT } from '@shell/config/query-params';
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
  },

  methods: {
    async finish(event) {
      try {
        removeEmptyAttrs(this.value);

        await this.save(event);
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
      }
    },
  }
};
</script>

<template>
  <Create v-if="isCreate" :value="value" :mode="mode" />
  <CruResource
    v-else
    :resource="value"
    :mode="realMode"
    :can-yaml="false"
    @finish="finish"
  >
    <Config :value="value" :mode="realMode" />
  </CruResource>
</template>
