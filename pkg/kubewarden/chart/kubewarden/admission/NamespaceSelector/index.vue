<script>
import isEmpty from 'lodash/isEmpty';

import { _CREATE } from '@shell/config/query-params';
import { set } from '@shell/utils/object';
import { POD } from '@shell/config/types';

import KeyValue from '@shell/components/form/KeyValue';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import InfoBox from '@shell/components/InfoBox';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { RadioGroup } from '@components/Form/Radio';

import { RANCHER_NS_MATCH_EXPRESSION } from '../../../../types';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },
    value: {
      type:    Object,
      default: () => {}
    }
  },

  components: {
    KeyValue, MatchExpressions, InfoBox, Checkbox, RadioGroup
  },

  data() {
    const parsedRancherNs = JSON.stringify(RANCHER_NS_MATCH_EXPRESSION);
    const matchExpressions = this.value?.matchExpressions || [];
    const matchLabels = this.value?.matchLabels || {};

    return {
      POD,
      parsedRancherNs,
      matchExpressions,
      matchLabels,
      ignoreRancherNamespaces: false,
      addSelector:             false
    };
  },

  created() {
    set(this, 'ignoreRancherNamespaces', this.hasNamespaceSelector);
  },

  watch: { ignoreRancherNamespaces: 'updateNamespaceSelector' },

  computed: {
    hasNamespaceSelector() {
      if ( !this.isCreate ) {
        return !isEmpty(this.value);
      }

      return true;
    }
  },

  methods: {
    updateNamespaceSelector(ignore) {
      if ( this.value ) {
        const expressions = this.value.matchExpressions || [];
        const exists = expressions?.some(exp => JSON.stringify(exp) === this.parsedRancherNs);

        if ( ignore ) {
          if ( !exists ) {
            this.$set(this.value, 'matchExpressions', [...expressions, RANCHER_NS_MATCH_EXPRESSION]);
          }
        } else if ( exists ) {
          this.$set(this.value, 'matchExpressions', expressions.filter(exp => JSON.stringify(exp) !== this.parsedRancherNs));
        }
      }
    }
  }
};
</script>

<template>
  <div>
    <p class="col span-12 mb-20">
      {{ t('kubewarden.policyConfig.namespaceSelector.description') }}
    </p>
    <div class="col span-6 mb-20">
      <RadioGroup
        v-model="ignoreRancherNamespaces"
        name="ignoreRancherNamespaces"
        :options="[true, false]"
        :mode="mode"
        :label="t('kubewarden.policyConfig.ignoreRancherNamespaces.label')"
        :labels="['Yes', 'No']"
        :tooltip="t('kubewarden.policyConfig.ignoreRancherNamespaces.tooltip')"
      />
    </div>

    <div class="divider mb-20"></div>

    <div class="col span-6 mb-20">
      <Checkbox
        v-model="addSelector"
        :label="t('kubewarden.policyConfig.namespaceSelector.addSelector')"
      />
    </div>

    <template v-if="addSelector">
      <InfoBox ref="infobox">
        <div class="row mb-20">
          <div class="col span-12">
            <h4>
              <t k="kubewarden.policyConfig.namespaceSelector.matchExpressions.label" />
              <i
                v-clean-tooltip="t('kubewarden.policyConfig.namespaceSelector.matchExpressions.tooltip')"
                class="icon icon-info icon-lg"
              />
            </h4>
            <span v-clean-tooltip="t('kubewarden.policyConfig.namespaceSelector.matchExpressions.tooltip')"></span>
            <MatchExpressions
              ref="matchexp"
              v-model="value.matchExpressions"
              :mode="mode"
              :show-remove="false"
              :type="POD"
            />
          </div>
        </div>
        <h4>
          <t k="kubewarden.policyConfig.namespaceSelector.matchLabels.label" />
          <i
            v-clean-tooltip="t('kubewarden.policyConfig.namespaceSelector.matchLabels.tooltip')"
            class="icon icon-info icon-lg"
          />
        </h4>
        <div class="row mb-20">
          <div class="col span-12">
            <KeyValue
              v-model="value.matchLabels"
              :mode="mode"
            />
          </div>
        </div>
      </InfoBox>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.divider {
  flex-basis: 100%;
  border-top: 1px solid var(--border);
}
</style>