<script>
import { mapGetters } from 'vuex';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { removeAt } from '@shell/utils/array';

import Loading from '@shell/components/Loading';

import { KUBEWARDEN_APPS } from '../../../types';
import { ARTIFACTHUB_PKG_ANNOTATION } from '../../../plugins/kubewarden-class';
import Rule from './Rule';

export default {
  name: 'Rules',

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

  components: { Loading, Rule },

  async fetch() {
    await this.$store.dispatch(`${ this.currentProduct.inStore }/findAll`, { type: 'apigroup' });

    this.rules = [];

    if ( !!this.value?.policy ) {
      this.rules = this.value.policy?.spec?.rules;
    }
  },

  data() {
    return { rules: null };
  },

  computed: {
    ...mapGetters(['currentProduct']),

    apiGroups() {
      return this.$store.getters[`${ this.currentProduct.inStore }/all`]('apigroup');
    },

    disabledRules() {
      const annotations = this.value.policy?.metadata?.annotations;

      return !!annotations?.[ARTIFACTHUB_PKG_ANNOTATION] || annotations?.['meta.helm.sh/release-name'] === KUBEWARDEN_APPS.RANCHER_DEFAULTS;
    },

    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    addRule() {
      this.rules.push({});
    },

    removeRule(index) {
      removeAt(this.rules, index);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else>
    <div v-for="(rule, index) in rules" :key="'filtered-rule-' + index">
      <Rule
        ref="lastRule"
        v-model="rules[index]"
        :disabled="disabledRules"
        :mode="mode"
        :api-groups="apiGroups"
      >
        <template v-if="!isView && !disabledRules" #removeRule>
          <button type="button" class="btn role-link p-0" @click="removeRule(index)">
            {{ t('kubewarden.policyConfig.rules.remove') }}
          </button>
        </template>
      </Rule>
    </div>

    <button v-if="!isView && !disabledRules" type="button" class="btn role-tertiary add" @click="addRule">
      {{ t('kubewarden.policyConfig.rules.add') }}
    </button>
  </div>
</template>
