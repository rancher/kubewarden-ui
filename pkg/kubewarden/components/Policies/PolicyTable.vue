<script>
import isEmpty from 'lodash/isEmpty';
import semver from 'semver';

import { SCHEMA } from '@shell/config/types';
import { _CREATE, CATEGORY, SEARCH_QUERY } from '@shell/config/query-params';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { ensureRegex } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';

import { KUBEWARDEN, KUBEWARDEN_PRODUCT_NAME } from '../../types';
import { POLICY_TABLE_HEADERS } from '../../config/table-headers';
import { resourcesFromAnnotation, isGlobalPolicy } from '../../modules/artifacthub';

import SortableTableWrapper from '../SortableTableWrapper';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    // ArtifactHub packages
    value: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  inject: ['chartType'],

  components: {
    LabeledSelect, LabeledInput, SortableTableWrapper
  },

  fetch() {
    const query = this.$route.query;

    this.category = query[CATEGORY] || '';
    this.searchQuery = query[SEARCH_QUERY] || '';
  },

  data() {
    return {
      KUBEWARDEN_PRODUCT_NAME,
      POLICY_TABLE_HEADERS,

      category:      null,
      keywords:      [],
      organizations: [],
      searchQuery:   null
    };
  },

  beforeMount() {
    if ( !isEmpty(this.filteredSubtypes) ) {
      const officialExists = this.filteredSubtypes.find(subtype => this.isOfficial(subtype));

      this.$nextTick(() => {
        if ( officialExists && officialExists.repository?.organization_display_name ) {
          this.organizations.push(officialExists.repository.organization_display_name);
        }
      });
    }
  },

  computed: {
    allSchemas() {
      return this.$store.getters['cluster/all'](SCHEMA);
    },

    filteredPackages() {
      const filteredPackages = this.value?.filter((artifactHubPackage) => {
        // Determine if the package is a pre-release
        const isPreRelease = this.isPrerelease(artifactHubPackage);

        if ( !this.showPreRelease && isPreRelease ) {
          return false; // Exclude pre-releases if showPreRelease is false
        }

        if ( this.chartType === KUBEWARDEN.ADMISSION_POLICY ) {
          return !isGlobalPolicy(artifactHubPackage, this.allSchemas);
        }

        return true;
      });

      return filteredPackages || [];
    },

    filteredSubtypes() {
      const subtypes = ( this.filteredPackages || [] );

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

        if ( this.keywords.length ) {
          for ( const selected of this.keywords ) {
            if ( !subtype.keywords || subtype.keywords?.length === 0 || !subtype.keywords?.includes(selected) ) {
              return false;
            }
          }
        }

        if ( this.organizations.length ) {
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
      const flattened = this.filteredSubtypes?.flatMap((subtype) => {
        if ( subtype?.keywords && subtype.keywords.length ) {
          return subtype.keywords;
        }
      });

      if ( !flattened || flattened?.length === 0 ) {
        return [];
      }

      return [...new Set(flattened.filter(Boolean))];
    },

    organizationOptions() {
      const out = this.filteredSubtypes?.flatMap((subtype) => {
        const name = subtype?.repository?.organization_display_name || subtype?.repository?.user_alias;

        return name || [];
      });

      if ( !out || out?.length === 0 ) {
        return [];
      }

      return [...new Set(out)];
    },

    resourceOptions() {
      return resourcesFromAnnotation(this.filteredSubtypes);
    },

    showPreRelease() {
      return this.$store.getters['prefs/get'](SHOW_PRE_RELEASE);
    }
  },

  methods: {
    hasAnnotation(subtype, annotation) {
      if ( subtype.data?.[annotation] && subtype.data?.[annotation] !== 'false' ) {
        return true;
      }

      return false;
    },

    isPrerelease(artifactHubPackage) {
      const parsed = semver.prerelease(artifactHubPackage.version);

      /**
       * Custom condition for Deprecated API Versions policy as these versions
       * have specific k8s versions attached (e.g. `v0.1.12-k8sv1.29.0`).
       */
      if ( parsed && artifactHubPackage.name === 'deprecated-api-versions' ) {
        return !!parsed.includes('rc');
      }

      return !!parsed;
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
  <div class="policy-table-container">
    <div class="filter">
      <LabeledSelect
        v-if="organizationOptions.length"
        v-model="organizations"
        data-testid="kw-table-filter-source"
        :clearable="true"
        :taggable="true"
        :mode="mode"
        :multiple="true"
        class="filter__source"
        :label="t('kubewarden.utils.source')"
        :options="organizationOptions"
      />

      <LabeledSelect
        v-model="keywords"
        data-testid="kw-table-filter-keywords"
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
        data-testid="kw-table-filter-resource"
        :clearable="true"
        :searchable="false"
        :mode="mode"
        :multiple="true"
        placement="bottom"
        class="filter__resource"
        :label="t('kubewarden.utils.resource')"
        :options="resourceOptions"
      />

      <LabeledInput
        ref="searchQuery"
        v-model="searchQuery"
        data-testid="kw-table-filter-search"
        :mode="mode"
        class="input-sm filter__search"
        :label="t('kubewarden.utils.search')"
        :placeholder="t('kubewarden.generic.name')"
      />

      <button
        ref="btn"
        data-testid="kw-table-filter-refresh"
        class="btn, btn-sm, role-primary, filter__reset"
        type="button"
        @click="refresh"
      >
        {{ t('kubewarden.utils.resetFilter') }}
      </button>
    </div>

    <SortableTableWrapper
      :rows="filteredSubtypes"
      :headers="POLICY_TABLE_HEADERS"
      :table-actions="false"
      :row-actions="false"
      key-field="package_id"
      default-sort-by="name"
      :paging="true"
      :search="false"
      @selectRow="(row) => $emit('selectType', row)"
    />
  </div>
</template>

<style lang="scss" scoped>
.policy-table-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter {
  width: 100%;
  display: grid;
  grid-template-columns: 20% 20% 20% 20% 8%;
  grid-template-rows: 1fr;
  grid-template-areas:
    "source keywords resource search reset";

  gap: 1rem;

  & > * {
    margin: 0.5rem 0;
  }

  &__source {
    grid-area: source;
  }

  &__keywords {
    grid-area: keywords;
  }

  &__resource {
    grid-area: resource;
  }

  &__search {
    grid-area: search;
  }

  &__reset {
    grid-area: reset;
    display: flex;
    line-height: 1.5;
  }
}

::v-deep tr:hover {
  cursor: pointer;
}
</style>
