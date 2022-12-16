<script>
import { _VIEW } from '@shell/config/query-params';
import { saferDump } from '@shell/utils/create-yaml';

import Loading from '@shell/components/Loading';

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

  components: { Loading, Values },

  fetch() {
    this.chartValues = {
      policy:    this.value,
      questions: null
    };

    this.yamlValues = saferDump(this.value);
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
  <Loading v-if="$fetchState.pending" />
  <Values v-else :value="value" :chart-values="chartValues" :yaml-values="yamlValues" :mode="mode" />
</template>
