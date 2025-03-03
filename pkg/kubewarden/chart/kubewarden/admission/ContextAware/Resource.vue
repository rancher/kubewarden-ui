<script>
import isEmpty from 'lodash/isEmpty';

import { _CREATE } from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';

import LabeledSelect from '@shell/components/form/LabeledSelect';

import * as coreTypes from '@kubewarden/core/core-resources';

export default {
  name: 'Resource',

  props: {
    /** Every groupVersion from apiGroups */
    apiGroupVersions: {
      type:     Array,
      required: true
    },

    disabled: {
      type:     Boolean,
      required: true
    },

    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:    Object,
      default: () => {}
    }
  },

  components: { LabeledSelect },

  watch: { 'value.apiVersion': 'clearKind' },

  computed: {
    allSchemas() {
      return this.$store.getters['cluster/all'](SCHEMA);
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    apiVersionOptions() {
      const out = [];

      if (!isEmpty(this.apiGroupVersions)) {
        this.apiGroupVersions.forEach((group) => out.push(group.groupVersion));
      }

      return out;
    },

    /** Find the matching schema to the group and return the availble Kinds */
    kindOptions() {
      const kindSchema = [];

      if (this.value?.apiVersion) {
        const matchedGroup = this.apiGroupVersions.find((group) => this.value.apiVersion === group.groupVersion);
        const matchedSchemas = this.schemaForGroup(matchedGroup);

        if (!isEmpty(matchedSchemas)) {
          matchedSchemas.forEach((schema) => kindSchema.push(schema.attributes?.kind));
        }
      }

      return kindSchema;
    }
  },

  methods: {
    clearKind() {
      if (!isEmpty(this.value.kind)) {
        this.value.kind = null;
      }
    },

    schemaForGroup(group) {
      if (!!group) {
        /**
         * If the 'core' group is selected, the Steve api does not have a mechanism to return only
         * the legacy resources that fall under 'core'. They appear in the schemas as having an
         * empty group... but there are **many** schemas that have an empty group, so they have
         * been declared in `./core/core.d.ts` to have a bonified list of core resources.
         */
        if (group.groupName === 'core') {
          const types = Object.values(coreTypes);

          return types;
        }

        return this.allSchemas?.filter((s) => s._group === group.groupName);
      }

      return null;
    },
  }
};
</script>

<template>
  <div
    v-if="value"
    class="resource-row mt-40 mb-20"
  >
    <div class="col span-4">
      <LabeledSelect
        v-model:value="value.apiVersion"
        data-testid="kw-policy-context-resource-apiversion-select"
        :disabled="disabled"
        :clearable="false"
        :searchable="true"
        :mode="mode"
        :multiple="false"
        :options="apiVersionOptions"
        placement="bottom"
        :label="t('kubewarden.policyConfig.contextAware.resource.apiVersion.label')"
        :tooltip="t('kubewarden.policyConfig.contextAware.resource.apiVersion.tooltip')"
      />
    </div>

    <div class="col span-4">
      <LabeledSelect
        v-model:value="value.kind"
        data-testid="kw-policy-context-resource-kind-select"
        :disabled="disabled"
        :clearable="false"
        :searchable="true"
        :mode="mode"
        :multiple="false"
        :options="kindOptions"
        placement="bottom"
        :label="t('kubewarden.policyConfig.contextAware.resource.kind.label')"
        :tooltip="t('kubewarden.policyConfig.contextAware.resource.kind.tooltip')"
      />
    </div>

    <slot name="removeResource" />
  </div>
</template>

<style lang="scss" scoped>
.resource-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
