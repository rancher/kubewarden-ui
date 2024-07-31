<script>
import merge from 'lodash/merge';

import { _VIEW } from '@shell/config/query-params';
import { saferDump } from '@shell/utils/create-yaml';
import { set } from '@shell/utils/object';

import Loading from '@shell/components/Loading';

import { ARTIFACTHUB_PKG_ANNOTATION, DATA_ANNOTATIONS, DEFAULT_POLICY } from '../../types';

import Values from './Values.vue';
import PolicyReadmePanel from './PolicyReadmePanel';

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

  components: {
    Loading, Values, PolicyReadmePanel
  },

  async fetch() {},

  async mounted() {
    this.chartValues = {
      policy:    this.value,
      questions: null
    };

    if ( this.value?.metadata?.annotations?.[ARTIFACTHUB_PKG_ANNOTATION] ) {
      try {
        const ahPackage = await this.value.artifactHubPackageVersion();

        if ( ahPackage && !ahPackage.error ) {
          this.artifactHubPackage = ahPackage;

          if ( ahPackage.description ) {
            this.shortDescription = ahPackage.description;
          }

          if ( ahPackage.readme ) {
            this.policyReadme = JSON.parse(JSON.stringify(ahPackage.readme));
          }

          if ( ahPackage.data?.[DATA_ANNOTATIONS.QUESTIONS] ) {
            const defaultPolicy = structuredClone(DEFAULT_POLICY);

            const merged = merge(defaultPolicy.spec.settings, this.chartValues.policy?.spec?.settings);

            set(this.chartValues.policy.spec, 'settings', merged);

            this.policyQuestions = this.value.parsePackageMetadata(ahPackage.data[DATA_ANNOTATIONS.QUESTIONS]);

            if ( this.policyQuestions ) {
              set(this.chartValues, 'questions', this.policyQuestions);
            }
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
      artifactHubPackage: null,
      chartValues:        null,
      yamlValues:         '',
      policyQuestions:    null,
      shortDescription:   '',
      policyReadme:       null
    };
  },

  methods: {
    showReadme() {
      this.$refs.readmePanel.show();
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="content">
      <div v-if="shortDescription || policyReadme" class="banner__title">
        <template v-if="shortDescription">
          <p class="banner__short-description">
            {{ shortDescription }}
          </p>
          <button v-if="policyReadme" class="btn btn-sm role-link banner__readme-button" @click="showReadme">
            {{ t('kubewarden.policyConfig.description.showReadme') }}
          </button>
        </template>
      </div>
      <Values
        :value="value"
        :chart-values="chartValues"
        :yaml-values="yamlValues"
        :mode="mode"
        @updateYamlValues="$emit('updateYamlValues', $event)"
      />
    </div>

    <template v-if="policyReadme">
      <PolicyReadmePanel
        ref="readmePanel"
        :package-values="artifactHubPackage"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.content {
  position: relative;
  z-index: 1;
}

.banner {
  &__title {
    padding-top: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--border);
    min-height: 60px;
  }

  &__readme-button {
    padding: 0 7px 0 0;
  }
}
</style>
