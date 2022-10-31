<script>
import flatMap from 'lodash/flatMap';
import isEmpty from 'lodash/isEmpty';

import { _CREATE } from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';

import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name: 'Rule',

  props: {
    // Full list of available apiGroups
    apiGroups: {
      type:     Array,
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
    this.inStore = this.$store.getters['currentStore']();
    this.schemas = this.$store.getters[`${ this.inStore }/all`](SCHEMA);
  },

  data() {
    const scopeOptions = [
      '*',
      'Cluster',
      'Namespaced'
    ];
    const operationOptions = [
      'CREATE',
      'UPDATE',
      'DELETE',
      'CONNECT'
    ];

    return {
      scopeOptions,
      operationOptions,

      inStore:           null,
      noResourceOptions: false,
      schemas:           null
    };
  },

  computed: {
    apiGroupOptions() {
      const out = ['*'];

      if ( !isEmpty(this.apiGroups) ) {
        this.apiGroups.map(g => out.push(g.id));

        return out;
      }

      out.push(this.apiGroups);

      return out;
    },

    apiVersionOptions() {
      let out = [];

      if ( !isEmpty(this.value?.apiGroups) && !this.isGroupCore ) {
        out = this.apiVersions(this.value.apiGroups, true);
      } else if ( !isEmpty(this.value?.resources) ) {
        out = this.apiVersions(this.value.resources, false);
      }

      return out;
    },

    isGroupCore() {
      const groups = this.value.apiGroups;
      const options = ['core', '*', ''];

      return options.some(o => groups.includes(o));
    },

    resourceOptions() {
      /*
        If no apiGroup or 'core' is selected we want to show all of the available resources
        Comparable to `kubectl api-resources -o wide`
      */
      let schemas = this.schemas;

      if ( this.value?.apiGroups?.length > 0 && !this.isGroupCore ) {
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
    }
  }
};
</script>

<template>
  <div v-if="value" class="rules-row mt-40 mb-20">
    <div>
      <LabeledSelect
        v-model="value.scope"
        :label="t('kubewarden.policyConfig.scope.label')"
        :tooltip="t('kubewarden.policyConfig.scope.tooltip')"
        :mode="mode"
        :multiple="false"
        :options="scopeOptions || []"
      />
    </div>

    <div>
      <LabeledSelect
        v-model="value.apiGroups"
        :label="t('kubewarden.policyConfig.apiGroups.label')"
        :tooltip="t('kubewarden.policyConfig.apiGroups.tooltip')"
        :mode="mode"
        :multiple="true"
        :options="apiGroupOptions || []"
        :required="true"
      />
    </div>

    <div>
      <LabeledSelect
        v-model="value.apiVersions"
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
        :label="t('kubewarden.policyConfig.operations.label')"
        :mode="mode"
        :multiple="true"
        :required="true"
        :options="operationOptions || []"
        :tooltip="t('kubewarden.policyConfig.operations.tooltip')"
      />
    </div>

    <div>
      <LabeledSelect
        v-model="value.resources"
        :label="t('kubewarden.policyConfig.resources.label')"
        :mode="mode"
        :multiple="true"
        :options="resourceOptions || []"
        :searchable="true"
        :required="true"
        :tooltip="t('kubewarden.policyConfig.resources.tooltip')"
      />
    </div>

    <slot name="removeRule" />
  </div>
</template>

<style lang="scss" scoped>
.rules-row{
  display: grid;
  grid-template-columns: .5fr 1fr 1fr 1fr 1fr .5fr;
  grid-column-gap: $column-gutter;
  align-items: center;
}
</style>
