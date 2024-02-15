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
      errors:           [],
      chartValues:      this.value,
      validationPassed: true,
    };
  },

  created() {
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
    handleValidationPassed(val) {
      this.validationPassed = val;
    },
    async finish(event) {
      // here we cleanup the securityContexts "seccompProfile" property if there are no keys set on the object
      ['pod', 'container'].forEach((type) => {
        if (this.chartValues?.spec?.securityContexts?.[type]?.seccompProfile && !Object.keys(this.chartValues?.spec?.securityContexts?.[type]?.seccompProfile).length) {
          delete this.chartValues?.spec?.securityContexts?.[type]?.seccompProfile;
        }
      });

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
    :validation-passed="validationPassed"
    @finish="finish"
    @error="e => errors = e"
  >
    <Values
      :value="value"
      :chart-values="chartValues"
      :mode="mode"
      @validation-passed="handleValidationPassed"
    />
  </CruResource>
</template>
