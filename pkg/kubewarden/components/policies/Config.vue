<script>
import { _VIEW } from '@shell/config/query-params';
import { saferDump } from '@shell/utils/create-yaml';

import Values from './Values.vue';

export default {
  name: 'Config',

  props: {
    mode: {
      type:     String,
      default:  _VIEW
    },
    value: {
      type:     Object,
      required: true
    }
  },

  components: { Values },

  async fetch() {
    this.chartValues = {
      policy:    this.value,
      questions: null
    };

    this.yamlValues = saferDump(this.value);

    let questionsJson = null;

    if ( this.value.spec?.settings ) {
      questionsJson = await this.value.policyQuestions();

      this.chartValues.questions = { questions: questionsJson };
    }
  },

  data() {
    return {
      chartValues: null,
      yamlValues:  ''
    };
  }
};
</script>

<template>
  <Values :value="value" :chart-values="chartValues" :yaml-values="yamlValues" :mode="mode" />
</template>
