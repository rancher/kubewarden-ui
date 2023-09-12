<script>
import isEmpty from 'lodash/isEmpty';

import { _CREATE, CATEGORY, SEARCH_QUERY } from '@shell/config/query-params';
import { ensureRegex } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';

import LabeledSelect from '@shell/components/form/LabeledSelect';

import { KUBEWARDEN_PRODUCT_NAME } from '../../types';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    // packages
    value: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  components: { LabeledSelect },

  fetch() {
    const query = this.$route.query;

    this.category = query[CATEGORY] || '';
    this.searchQuery = query[SEARCH_QUERY] || '';
  },

  data() {
    return {
      KUBEWARDEN_PRODUCT_NAME,

      category:      null,
      keywords:      [],
      organizations: [],
      searchQuery:   null
    };
  },

  beforeMount() {
    if ( !isEmpty(this.value) ) {
      const officialExists = this.value.find(subtype => this.isOfficial(subtype));

      this.$nextTick(() => {
        if ( officialExists && officialExists.repository?.organization_display_name ) {
          this.organizations.push(officialExists.repository.organization_display_name);
        }
      });
    }
  },

  computed: {
    filteredSubtypes() {
      const subtypes = ( this.value || [] );

      const out = subtypes.filter((subtype) => {
        if ( this.category ) {
          if ( !this.hasAnnotation(subtype, 'kubewarden/resources') || !subtype.data?.['kubewarden/resources']?.includes(this.category) ) {
            return false;
          }
        }

        if ( this.searchQuery ) {
          const searchTokens = this.searchQuery.split(/\s*[, ]\s*/).map(x => ensureRegex(x, false));

          for ( const token of searchTokens ) {
            if ( !subtype.display_name?.match(token) && (subtype.description && !subtype.description.match(token)) ) {
              return false;
            }
          }
        }

        if ( this.keywords ) {
          for ( const selected of this.keywords ) {
            if ( !subtype.keywords || subtype.keywords?.length === 0 || !subtype.keywords?.includes(selected) ) {
              return false;
            }
          }
        }

        if ( this.organizations ) {
          for ( const org of this.organizations ) {
            const name = subtype.repository?.organization_display_name || subtype.repository?.user_alias;

            if ( !name || name !== org ) {
              return false;
            }
          }
        }

        return true;
      });

      return sortBy(out, ['name']);
    },

    keywordOptions() {
      const flattened = this.value?.flatMap((subtype) => {
        if ( subtype.keywords && subtype.keywords.length ) {
          return subtype.keywords;
        }
      });

      if ( !flattened || flattened?.length === 0 ) {
        return [];
      }

      return [...new Set(flattened.filter(Boolean))];
    },

    organizationOptions() {
      const out = this.value?.flatMap((subtype) => {
        const name = subtype.repository?.organization_display_name || subtype.repository?.user_alias;

        return name || [];
      });

      if ( !out || out?.length === 0 ) {
        return [];
      }

      return [...new Set(out)];
    },

    resourceOptions() {
      const out = [];

      const resources = this.value?.flatMap((subtype) => {
        const annotation = subtype.data?.['kubewarden/resources'];

        if ( annotation ) {
          return annotation;
        }
      });

      resources?.flatMap((resource) => {
        if ( resource ) {
          const split = resource.split(',');

          if ( split.length > 1 ) {
            split.forEach(s => out.push(s));
          } else {
            out.push(resource);
          }
        }

        return [];
      })?.sort();

      if ( !out || out?.length === 0 ) {
        return [];
      }

      return [...new Set(out.filter(Boolean))];
    }
  },

  methods: {
    hasAnnotation(subtype, annotation) {
      return subtype.data?.[annotation];
    },

    refresh() {
      this.category = null;
      this.keywords = [];
      this.organizations = [];
      this.searchQuery = null;
    },

    resourceType(type) {
      if ( type === undefined ) {
        return null;
      }

      const t = type?.split(',');

      if ( t?.length > 1 ) {
        return 'Multiple';
      }

      return type === '*' ? 'Global' : type;
    },

    isOfficial(subtype) {
      return subtype?.repository?.organization_name?.toLowerCase() === KUBEWARDEN_PRODUCT_NAME;
    },

    subtypeSignature(subtype) {
      return subtype.signatures?.[0] || 'unknown';
    }
  }
};
</script>

<template>
  <form
    class="create-resource-container step__policies"
  >
    <div class="filter">
      <LabeledSelect
        v-if="organizationOptions.length"
        v-model="organizations"
        data-testid="kw-grid-filter-organization"
        :clearable="true"
        :taggable="true"
        :mode="mode"
        :multiple="true"
        class="filter__organization"
        :label="t('kubewarden.utils.organization')"
        :options="organizationOptions"
      />

      <LabeledSelect
        v-model="keywords"
        data-testid="kw-grid-filter-keywords"
        :clearable="true"
        :taggable="true"
        :mode="mode"
        :multiple="true"
        class="filter__keywords"
        :label="t('kubewarden.utils.keyword')"
        :options="keywordOptions"
      />

      <LabeledSelect
        v-model="category"
        data-testid="kw-grid-filter-category"
        :clearable="true"
        :searchable="false"
        :mode="mode"
        :multiple="true"
        placement="bottom"
        class="filter__category"
        :label="t('kubewarden.utils.resource')"
        :options="resourceOptions"
      />

      <input
        ref="searchQuery"
        v-model="searchQuery"
        data-testid="kw-grid-filter-search"
        type="search"
        class="input-sm filter__search"
        :placeholder="t('catalog.charts.search')"
      >
      <button
        ref="btn"
        data-testid="kw-grid-filter-refresh"
        class="btn, btn-sm, role-primary"
        type="button"
        @click="refresh"
      >
        {{ t('kubewarden.utils.resetFilter') }}
      </button>
    </div>

    <div class="grid">
      <slot name="customSubtype"></slot>

      <div
        v-for="subtype in filteredSubtypes"
        :key="subtype.package_id"
        :data-testid="`kw-grid-subtype-card-${ subtype.package_id }`"
        class="subtype"
        @click="$emit('selectType', subtype)"
      >
        <div class="subtype__metadata">
          <div v-if="hasAnnotation(subtype, 'kubewarden/resources')" class="subtype__badge">
            <label>{{ resourceType(subtype.data['kubewarden/resources']) }}</label>
          </div>

          <div class="subtype__left">
            <div v-if="subtype.signed" class="subtype__signed">
              <span v-clean-tooltip="t('kubewarden.policyCharts.signedPolicy.tooltip', { signatures: subtypeSignature(subtype) })">
                <i class="icon icon-lock" />
              </span>
            </div>

            <div v-if="isOfficial(subtype)" class="subtype__icon">
              <img
                v-clean-tooltip="t('kubewarden.policies.official')"
                src="../../assets/icon-kubewarden.svg"
                :alt="t('kubewarden.policies.official')"
                class="ml-5"
              >
            </div>
          </div>

          <div v-if="hasAnnotation(subtype, 'kubewarden/mutation')" class="subtype__mutation">
            <span v-clean-tooltip="t('kubewarden.policyCharts.mutationPolicy.tooltip')">
              {{ t('kubewarden.policyCharts.mutationPolicy.label') }}
            </span>
          </div>

          <div v-if="hasAnnotation(subtype, 'kubewarden/contextAwareResources')" class="subtype__aware">
            <span v-clean-tooltip="t('kubewarden.policyCharts.contextAware.tooltip')">
              {{ t('kubewarden.policyCharts.contextAware.label') }}
            </span>
          </div>

          <div class="subtype__label">
            <h4>
              {{ subtype.display_name }}
            </h4>
          </div>

          <div v-if="subtype.description" class="subtype__description mb-20">
            {{ subtype.description }}
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
$margin: 10px;

.step {
  &__policies {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-x: hidden;

    .spacer {
      line-height: 2;
    }
  }
}

.filter {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-self: flex-end;

  & > * {
    margin: $margin;
    max-width: 33%;
  }
  & > *:first-child {
    margin-left: 0;
  }
  & > *:last-child {
    margin-right: 0;
  }

  &__category {
    min-width: 200px;
    height: unset;
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

.grid {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin: 0 -1*$margin;

  .custom {
    height: 110px;
  }

  .subtype {
    height: auto;
  }

  @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
    .subtype {
      width: 100%;
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
    .subtype {
      width: calc(50% - 2 * #{$margin});
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
    .subtype {
      width: calc(33.33333% - 2 * #{$margin});
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
    .subtype {
      width: calc(25% - 2 * #{$margin});
    }
  }
  @media only screen and (min-width: 1600px) {
    .subtype {
      &__label {
        max-width: 100%;
      }

      h4 {
        white-space: nowrap;
      }
    }
  }

  .disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.subtype {
  &__label {
    max-width: 205px;

    h4 {
      white-space: normal;
    }
  }

  &__badge {
    background-color: var(--darker);
    padding: 4px 5px;
  }

  &__left, &__mutation, &__aware {
    position: absolute;
    bottom: 5px;
  }

  &__mutation, &__aware {
    border: 1px solid var(--border);
    padding: 0px 5px;
  }

  &__left {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }

  &__mutation {
    right: 10px;
  }

  &__aware {
    right: 80px;
  }

  &__icon {
    width: 20px;
  }
}
</style>
