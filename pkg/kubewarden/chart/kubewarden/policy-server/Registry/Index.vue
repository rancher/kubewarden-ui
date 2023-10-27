<script>
import { _CREATE } from '@shell/config/query-params';

import ArrayList from '@shell/components/form/ArrayList';
import { Banner } from '@components/Banner';

import SourceAuthorities from './SourceAuthorities';

export default {
  name: 'Registry',

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    // chartValues.spec
    value: {
      type:     Object,
      default: null
    }
  },

  components: {
    ArrayList,
    Banner,
    SourceAuthorities
  },

  fetch() {
    this.insecureSources = this.chartValues?.insecureSources || [];
    this.sourceAuthorities = this.chartValues?.sourceAuthorities || {};
  },

  data() {
    return {
      chartValues:       this.value,
      insecureSources:   null,
      sourceAuthorities: null
    };
  },

  watch: {
    insecureSources(neu) {
      this.$emit('update-registry', 'insecureSources', neu);
    },
    sourceAuthorities(neu) {
      this.$emit('update-registry', 'sourceAuthorities', neu);
    }
  },

  methods: {
    update(prop) {
      this.$set(this.chartValues, [prop], this[prop]);
    }
  }
};
</script>

<template>
  <div class="mt-10 mb-20">
    <div class="row">
      <Banner
        v-clean-html="t('kubewarden.policyServerConfig.registry.description', {}, true)"
        data-testid="ps-config-registry-banner"
        class="type-banner mb-20 mt-0"
        color="info"
      />
    </div>

    <template>
      <h3 class="mb-20">
        {{ t('kubewarden.policyServerConfig.insecureSources.title') }}
      </h3>
      <div class="row">
        <div class="col span-6">
          <ArrayList
            v-model="insecureSources"
            data-testid="ps-config-insecure-sources-input"
            :mode="mode"
            :add-allowed="true"
            :add-label="t('kubewarden.policyServerConfig.insecureSources.addLabel')"
            :value-placeholder="t('kubewarden.policyServerConfig.insecureSources.placeholder')"
            @input="update('insecureSources')"
          />
        </div>
      </div>
    </template>

    <div class="spacer"></div>

    <template>
      <div class="row mb-20">
        <div class="col span-12">
          <SourceAuthorities
            ref="sourceAuthorities"
            v-model="sourceAuthorities"
            :mode="mode"
          />
        </div>
      </div>
    </template>
  </div>
</template>
