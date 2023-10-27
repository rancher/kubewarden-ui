<script>
import merge from 'lodash/merge';

import { _CREATE, _EDIT } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';

import CruResource from '@shell/components/CruResource';

import { DEFAULT_POLICY_SERVER } from '../models/policies.kubewarden.io.policyserver';

import Values from '../components/PolicyServer/Values';

export default {
  components: { CruResource, Values },

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
    return {
      errors:      [],
      chartValues: null
    };
  },

  created() {
    this.chartValues = this.value;

    if ( this.isCreate ) {
      merge(this.chartValues, structuredClone(DEFAULT_POLICY_SERVER));
    }
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
  <CruResource
    :resource="value"
    :mode="realMode"
    :can-yaml="false"
    :done-route="doneRoute"
    :errors="errors"
    @finish="finish"
    @error="e => errors = e"
  >
    <Values :value="value" :chart-values="chartValues" :mode="mode" />
  </CruResource>
</template>
