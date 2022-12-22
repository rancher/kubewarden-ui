<script>
import { mapGetters } from 'vuex';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { removeAt } from '@shell/utils/array';

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

  components: { Rule },

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
  <div>
    <div v-for="(rule, index) in rules" :key="'filtered-rule-' + index">
      <Rule
        ref="lastRule"
        v-model="rules[index]"
        :mode="mode"
        :api-groups="apiGroups"
      >
        <template v-if="!isView" #removeRule>
          <button type="button" class="btn role-link p-0" @click="removeRule(index)">
            {{ t('kubewarden.policyConfig.rules.remove') }}
          </button>
        </template>
      </Rule>
    </div>

    <button v-if="!isView" type="button" class="btn role-tertiary add" @click="addRule">
      {{ t('kubewarden.policyConfig.rules.add') }}
    </button>
  </div>
</template>
