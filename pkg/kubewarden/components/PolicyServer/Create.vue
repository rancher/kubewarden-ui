<script>
import merge from 'lodash/merge';
import jsyaml from 'js-yaml';
import { _CREATE } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';
import { clone } from '@shell/utils/object';

import CruResource from '@shell/components/CruResource';

import { DEFAULT_POLICY_SERVER } from '../../models/policies.kubewarden.io.policyserver';
import Values from './Values';

export default {
  name: 'Create',

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      required: true
    }
  },

  components: { Values, CruResource },

  mixins: [CreateEditView],

  fetch() {
    this.errors = [];

    this.chartValues = { questions: structuredClone(DEFAULT_POLICY_SERVER) };

    this.value.apiVersion = `${ this.schema?.attributes?.group }.${ this.schema?.attributes?.version }`;
    this.value.kind = this.schema?.attributes?.kind;

    merge(this.chartValues.questions, this.value);
  },

  data() {
    return {
      errors:      null,
      chartValues: null,
    };
  },

  methods: {
    async finish(event) {
      try {
        merge(this.value, this.chartValues?.questions);

        await this.save(event);
      } catch (e) {
        this.errors.push(e);
      }
    },

    generateYaml() {
      const cloned = this.chartValues?.questions ? clone(this.chartValues.questions) : this.value;

      return jsyaml.dump(cloned);
    }
  }
};
</script>

<template>
  <CruResource
    :resource="value"
    :mode="realMode"
    :done-route="doneRoute"
    :errors="errors"
    :generate-yaml="generateYaml"
    @finish="finish"
    @error="e => errors = e"
  >
    <Values :value="value" :chart-values="chartValues" :mode="mode" />
  </CruResource>
</template>
