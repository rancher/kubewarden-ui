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
      resources:        null,
      operations:       null
    };
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
        const flatOperations = flatRules.flatMap(r => r.operations);

        if ( this.operations ) {
          for ( const selected of this.operations ) {
            if ( !flatOperations.includes(selected) ) {
              return false;
            }
          }
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

    resourceOptions() {
      return this.flattenRule('resources');
    },

    operationOptions() {
      return this.flattenRule('operations');
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
      this.$set(this, 'operations', null);
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
        label="Filter by Resource"
        :options="resourceOptions"
      />
      <LabeledSelect
        v-model="operations"
        :clearable="true"
        :searchable="false"
        :options="operationOptions"
        :multiple="true"
        placement="bottom"
        class="filter__operations"
        label="Filter by Operations"
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

    <ResourceTable :schema="schema" :rows="filteredRows" :headers="headers">
      <template #col:mode="{ row }">
        <td>
          <span class="policy__mode">
            <span class="text-capitalize">{{ row.spec.mode }}</span>
            <i
              v-if="hasNamespaceSelector(row)"
              v-tooltip.bottom="t('kubewarden.policies.namespaceWarning')"
              class="icon icon-warning"
            />
          </span>
        </td>
      </template>
    </ResourceTable>
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
