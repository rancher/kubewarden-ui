<script>
import { mapGetters } from 'vuex';
import flatMap from 'lodash/flatMap';
import isEmpty from 'lodash/isEmpty';

import { _CREATE } from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';

import LabeledSelect from '@shell/components/form/LabeledSelect';

import { KUBEWARDEN } from '../../../types';

export default {
  name: 'Rule',

  props: {
    // Full list of available apiGroups
    apiGroups: {
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

  inject: ['chartType'],

  components: { LabeledSelect },

  fetch() {
    this.schemas = this.$store.getters[`${ this.currentProduct.inStore }/all`](SCHEMA);

    if ( this.isCreate && isEmpty(this.value?.apiGroups) ) {
      if ( !Array.isArray(this.value.apiGroups) ) {
        this.$set(this.value, 'apiGroups', []);
      }

      this.value.apiGroups.push('*');
    }
  },

  data() {
    const apiGroupValues = this.value?.apiGroups || [];

    const scopeOptions = [
      '*',
      'Cluster',
      'Namespaced'
    ];
    const operationOptions = [
      '*',
      'CREATE',
      'UPDATE',
      'DELETE',
      'CONNECT'
    ];

    return {
      scopeOptions,
      operationOptions,
      apiGroupValues,

      noResourceOptions: false,
      schemas:           null
    };
  },

  computed: {
    ...mapGetters(['currentProduct']),

    apiGroupOptions() {
      const out = ['*'];

      if ( !isEmpty(this.apiGroups) ) {
        this.apiGroups.map(g => out.push(g.id));

        const coreIndex = out.indexOf('core');

        if ( coreIndex ) {
          // Removing core from apiGroups as this leads to zero resources
          out.splice(coreIndex, 1);
        }

        return out.sort();
      }

      out.push(this.apiGroups);

      return out.sort();
    },

    apiVersionOptions() {
      let out = [];

      if ( !isEmpty(this.value?.apiGroups) && !this.isGroupAll ) {
        out = this.apiVersions(this.value.apiGroups, true);
      } else if ( !isEmpty(this.value?.resources) ) {
        out = this.apiVersions(this.value.resources, false);
      }

      return out;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isGlobalRule() {
      return this.chartType === KUBEWARDEN.CLUSTER_ADMISSION_POLICY;
    },

    isGroupAll() {
      const groups = this.value?.apiGroups;

      if ( groups.length === 0 || groups.includes('*') ) {
        return true;
      }

      return false;
    },

    resourceOptions() {
      /*
        If no apiGroup or '*' is selected we want to show all of the available resources
        Comparable to `kubectl api-resources -o wide`
      */
      let schemas = this.schemas;

      if ( this.value?.apiGroups?.length > 0 && !this.isGroupAll ) {
        schemas = this.value.apiGroups.map(g => this.schemaForGroup(g))[0];
      }

      const filtered = schemas?.filter(s => s?.attributes?.resource);
      const resourceSet = [...new Set(filtered?.map(f => f.attributes.resource))];

      return resourceSet.sort();
    }
  },

  methods: {
    schemaForGroup(group) {
      if ( !!group ) {
        return this.schemas?.filter((s) => {
          return s._group === group;
        });
      }

      return null;
    },

    // Determine which apiVersions to show, either from the apiGroup or targeted resource
    apiVersions(types, isGroup) {
      let versions = [];

      types?.forEach((type) => {
        const toFind = isGroup ? this.apiGroups : this.schemas;

        toFind.find((f) => {
          if ( isGroup && f.id === type ) {
            versions = [...versions, flatMap(f.versions, v => v.groupVersion)];
          } else if ( f.attributes?.resource === type ) {
            versions = [...versions, f.attributes.version];
          }
        });
      });

      return [...new Set(flatMap(versions))];
    },

    setGroup(event) {
      if ( this.value?.apiGroups?.includes(event) ) {
        return;
      }

      if ( !this.value?.apiGroups?.includes(event) ) {
        this.value.apiGroups.pop();
      }

      this.value?.apiGroups?.push(event);
    }
  }
};
</script>

<template>
  <div
    v-if="value"
    class="rules-row mt-40 mb-20"
    :class="{ 'global-rules': isGlobalRule, 'namespaced-rules': !isGlobalRule }"
  >
    <div v-if="isGlobalRule">
      <LabeledSelect
        v-model="value.scope"
        :disabled="disabled"
        :label="t('kubewarden.policyConfig.scope.label')"
        :tooltip="t('kubewarden.policyConfig.scope.tooltip')"
        :mode="mode"
        :multiple="false"
        :options="scopeOptions || []"
      />
    </div>

    <div>
      <LabeledSelect
        v-model="apiGroupValues"
        :disabled="disabled"
        :label="t('kubewarden.policyConfig.apiGroups.label')"
        :tooltip="t('kubewarden.policyConfig.apiGroups.tooltip')"
        :mode="mode"
        :multiple="false"
        :options="apiGroupOptions || []"
        :required="true"
        @selecting="setGroup"
      />
    </div>

    <div>
      <LabeledSelect
        v-model="value.resources"
        :disabled="disabled"
        :label="t('kubewarden.policyConfig.resources.label')"
        :mode="mode"
        :multiple="true"
        :options="resourceOptions || []"
        :searchable="true"
        :required="true"
        :tooltip="t('kubewarden.policyConfig.resources.tooltip')"
      />
    </div>

    <div>
      <LabeledSelect
        v-model="value.apiVersions"
        :disabled="disabled"
        :clearable="true"
        :searchable="false"
        :mode="mode"
        :multiple="true"
        :options="apiVersionOptions || []"
        :required="true"
        placement="bottom"
        :label="t('kubewarden.policyConfig.apiVersions.label')"
        :tooltip="t('kubewarden.policyConfig.apiVersions.tooltip')"
      />
    </div>

    <div>
      <LabeledSelect
        v-model="value.operations"
        :disabled="disabled"
        :label="t('kubewarden.policyConfig.operations.label')"
        :mode="mode"
        :multiple="true"
        :required="true"
        :options="operationOptions || []"
        :tooltip="t('kubewarden.policyConfig.operations.tooltip')"
      />
    </div>

    <slot name="removeRule" />
  </div>
</template>

<style lang="scss" scoped>
.rules-row {
  display: grid;
  grid-template-columns: .5fr 1fr 1fr 1fr 1fr .5fr;
  grid-column-gap: $column-gutter;
  align-items: center;
}

.global-rules {
  grid-template-columns: .5fr 1fr 1fr 1fr 1fr .5fr;
}

.namespaced-rules {
  grid-template-columns: 1fr 1fr 1fr 1fr .5fr;
}
</style>
