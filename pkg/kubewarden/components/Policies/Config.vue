<script>
import merge from 'lodash/merge';

import { _VIEW } from '@shell/config/query-params';
import { saferDump } from '@shell/utils/create-yaml';
import { set } from '@shell/utils/object';

import Loading from '@shell/components/Loading';

import { ARTIFACTHUB_PKG_ANNOTATION, DATA_ANNOTATIONS, DEFAULT_POLICY } from '../../types';

import Values from './Values.vue';

export default {
  name: 'Config',

  props: {
    mode: {
      type:     String,
      default:  _VIEW
    },
    value: {
      type:    Object,
      default: () => {}
    }
  },

  components: { Loading, Values },

  async fetch() {},

  async mounted() {
    this.chartValues = {
      policy:    this.value,
      questions: null
    };

    if ( this.value?.metadata?.annotations?.[ARTIFACTHUB_PKG_ANNOTATION] ) {
      try {
        const artifactHubPackage = await this.value.artifactHubPackageVersion();

        if ( artifactHubPackage && !artifactHubPackage.error && artifactHubPackage.data?.[DATA_ANNOTATIONS.QUESTIONS] ) {
          const defaultPolicy = structuredClone(DEFAULT_POLICY);

          const merged = merge(defaultPolicy.spec.settings, this.chartValues.policy?.spec?.settings);

          set(this.chartValues.policy.spec, 'settings', merged);

          this.policyQuestions = this.value.parsePackageMetadata(artifactHubPackage.data[DATA_ANNOTATIONS.QUESTIONS]);

          if ( this.policyQuestions ) {
            set(this.chartValues, 'questions', this.policyQuestions);
          }
        }
      } catch (e) {
        console.warn(`Unable to fetch artifacthub package: ${ e }`); // eslint-disable-line no-console
      }
    }

    this.yamlValues = saferDump(this.value);
  },

  data() {
    return {
      chartValues:     null,
      yamlValues:      '',
      policyQuestions: null
    };
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <Values
    v-else
    :value="value"
    :chart-values="chartValues"
    :yaml-values="yamlValues"
    :mode="mode"
    @updateYamlValues="$emit('updateYamlValues', $event)"
  />
</template>
