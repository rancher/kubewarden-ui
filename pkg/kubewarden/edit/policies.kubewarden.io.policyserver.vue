<script>
import merge from 'lodash/merge';

import { _CREATE, _EDIT } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';

import { Banner } from '@components/Banner';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';

import { DEFAULT_POLICY_SERVER } from '@kubewarden/models/policies.kubewarden.io.policyserver';
import { KUBEWARDEN } from '@kubewarden/types';

import Values from '@kubewarden/components/PolicyServer/Values';

export default {
  components: {
    Banner,
    CruResource,
    Loading,
    Values
  },

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

  async fetch() {
    const schema = this.$store.getters[`cluster/schemaFor`](KUBEWARDEN.POLICY_SERVER);

    await schema.fetchResourceFields();
  },

  data() {
    return { chartValues: this.value };
  },

  created() {
    if (this.isCreate) {
      merge(this.chartValues, structuredClone(DEFAULT_POLICY_SERVER));
    }
  },

  computed: {
    isCreate() {
      return this.realMode === _CREATE;
    },

    hasErrors() {
      return this.errors?.length && Array.isArray(this.errors);
    },

    validationPassed() {
      return !!this.chartValues?.metadata?.name;
    }
  },

  methods: {
    closeError(index) {
      const errors = this.errors.filter((_, i) => i !== index);

      this.errors = errors;
    },

    async finish(event) {
      // Clean up the securityContexts "seccompProfile" property if there are no keys set on the object
      const securityContexts = this.chartValues?.spec?.securityContexts;

      if (securityContexts) {
        ['pod', 'container'].forEach((type) => {
          const seccompProfile = securityContexts[type]?.seccompProfile;

          if (seccompProfile && Object.keys(seccompProfile).length === 0) {
            delete securityContexts[type].seccompProfile;
          }
        });
      }

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
  <Loading v-if="$fetchState.pending" mode="relative" />
  <CruResource
    v-else
    :resource="value"
    :mode="realMode"
    :can-yaml="false"
    :done-route="doneRoute"
    :errors="errors"
    :validation-passed="validationPassed"
    @finish="finish"
  >
    <Values
      :value="value"
      :chart-values="chartValues"
      :mode="mode"
    />
    <div
      v-if="hasErrors"
      id="cru-errors"
      class="cru__errors"
    >
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :data-testid="`error-banner${ i }`"
        :closable="true"
        @close="closeError(i)"
      >
        {{ err }}
      </Banner>
    </div>
  </CruResource>
</template>
