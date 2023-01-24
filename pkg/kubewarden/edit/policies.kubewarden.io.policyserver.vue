<script>
import { _CREATE, _EDIT } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';

import CruResource from '@shell/components/CruResource';

import Values from '../components/PolicyServer/Values';
import Create from '../components/PolicyServer/Create';

export default {
  components: {
    CruResource, Values, Create
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:    String,
      default: _EDIT
    },

    realMode: {
      type:    String,
      default: _EDIT
    },

    value: {
      type:     Object,
      required: true
    },
  },

  data() {
    return { errors: [] };
  },

  computed: {
    isCreate() {
      return this.realMode === _CREATE;
    }
  },

  methods: {
    async finish(event) {
      try {
        await this.save(event);
      } catch (e) {
        this.errors.push(e);
      }
    }
  }
};
</script>

<template>
  <Create v-if="isCreate" :value="value" :mode="mode" />
  <CruResource
    v-else
    :resource="value"
    :mode="realMode"
    :errors="errors"
    @finish="finish"
  >
    <Values :value="value" :mode="mode" />
  </CruResource>
</template>
