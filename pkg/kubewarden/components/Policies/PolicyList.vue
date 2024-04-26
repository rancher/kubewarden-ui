<script>
import flattenDeep from 'lodash/flattenDeep';
import { sortBy } from '@shell/utils/sort';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  components: { LabeledSelect, ResourceTable },

  props: {
    resource: {
      type:     String,
      required: true
    },
    rows: {
      type:     Array,
      required: true
    },
    schema: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      mode:             null,
      resources:        null
    };
  },

  created() {
    this.mode = 'All';
  },

  computed: {
    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    filteredRows() {
      const rows = ( this.rows || [] );

      const out = rows.filter((row) => {
        const flatRules = flattenDeep(row.spec.rules);
        const flatResources = flatRules.flatMap(r => r.resources);
        const rowMode = row.spec.mode;

        if ( this.mode && this.mode !== 'All' && this.mode !== rowMode ) {
          return false;
        }

        if ( this.resources ) {
          for ( const selected of this.resources ) {
            if ( !flatResources.includes(selected) ) {
              return false;
            }
          }
        }

        return true;
      });

      return sortBy(out, ['id']);
    },

    modeOptions() {
      const out = this.rows?.map(row => row.spec?.mode) || [];

      out.unshift('All');

      return [...new Set(out)];
    },

    resourceOptions() {
      return this.flattenRule('resources');
    }
  },

  methods: {
    flattenRule(option) {
      const flattened = this.rows?.flatMap((row) => {
        const flatRules = flattenDeep(row.spec?.rules);

        return flatRules.flatMap(r => r[option]);
      });

      return [...new Set(flattened)] || [];
    },

    hasNamespaceSelector(row) {
      return row.namespaceSelector;
    },

    resetFilter() {
      this.$set(this, 'resources', null);
      this.$set(this, 'mode', 'All');
    }
  }
};
</script>

<template>
  <div>
    <div class="filter">
      <LabeledSelect
        v-model="resources"
        :clearable="true"
        :taggable="true"
        :multiple="true"
        class="filter__resources"
        label="Search by Resource"
        :options="resourceOptions"
      />
      <LabeledSelect
        v-model="mode"
        :clearable="true"
        :searchable="false"
        :options="modeOptions"
        :multiple="false"
        placement="bottom"
        class="filter__mode"
        label="Search by Mode"
      />
      <button
        ref="btn"
        class="btn, btn-sm, role-primary"
        type="button"
        @click="resetFilter"
      >
        {{ t('kubewarden.utils.resetFilter') }}
      </button>
    </div>

    <ResourceTable :schema="schema" :rows="filteredRows" :headers="headers" />
  </div>
</template>

<style lang="scss" scoped>
.filter {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-self: flex-end;

  & > * {
    margin: 10px;
  }
  & > *:first-child {
    margin-left: 0;
  }
  & > *:last-child {
    margin-right: 0;
  }
}

@media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
  .filter {
    width: 100%;
  }
}
@media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
  .filter {
    width: 75%;
  }
}

.policy {
  &__mode {
    display: flex;
    align-items: center;

    i {
      margin-left: 5px;
      font-size: 22px;
      color: var(--warning);
    }
  }
}
</style>
