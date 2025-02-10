<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import semver from 'semver';

import { SCHEMA } from '@shell/config/types';
import { _CREATE, CATEGORY, SEARCH_QUERY } from '@shell/config/query-params';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { ensureRegex } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import SortableTableWrapper from '../SortableTableWrapper';

import { KUBEWARDEN, PolicyChart } from '../../types';
import { POLICY_TABLE_HEADERS } from '../../config/table-headers';
import { resourcesFromAnnotation, isGlobalPolicy } from '../../modules/policyChart';

interface Props {
  mode: string;
  charts: PolicyChart[];
}

const props = defineProps<Props>();

const emit = defineEmits(['selectPolicy']);

/**
 * Provided in `./edit/policies.kubewarden.io.(cluster)admissionpolicy.vue`
 */
const chartType = inject<string>('chartType', '');

const store = useStore();
const route = useRoute();
const t = store.getters['i18n/t'];

const category = ref<string>(route?.query?.[CATEGORY] as string || '');
const searchQuery = ref<string>(route?.query?.[SEARCH_QUERY] as string || '');
const attributes = ref<string[]>([t('kubewarden.utils.attributes.optionLabels.all')]);
const showKubewardenOfficial = ref<boolean>(true);

const allSchemas = computed(() => store.getters['cluster/all'](SCHEMA));

const showPreRelease = computed<boolean>(() => store.getters['prefs/get'](SHOW_PRE_RELEASE));

const computedAttributes = computed<string[]>({
  get() {
    return attributes.value;
  },
  set(newVal: string[]) {
    const allLabel = t('kubewarden.utils.attributes.optionLabels.all');

    let cleaned = [ ...newVal ];

    if (!cleaned.length) {
      cleaned = [allLabel];
    }

    if (cleaned.length > 1 && cleaned.includes(allLabel)) {
      cleaned = cleaned.filter(x => x !== allLabel);
    }

    attributes.value = cleaned;
  }
});

/**
 * Return charts filtering out global policies (if Admission Policy),
 * and pre-release charts if the user doesn't want to see them.
 */
const filteredCharts = computed(() => {
  return props.charts?.filter((chart) => {
    // Determine if the package is a pre-release
    const isPreRelease = isPrerelease(chart);
    if (!showPreRelease.value && isPreRelease) {
      return false; // Exclude pre-releases if showPreRelease is false
    }

    if (chartType === KUBEWARDEN.ADMISSION_POLICY) {
      // Filter out cluster-level Admission Policy charts
      return !isGlobalPolicy(chart, allSchemas.value);
    }

    return true;
  }) || [];
});

/**
 * Derived from `filteredCharts` - applies search queries, attribute filters, etc.
 */
const filteredPolicies = computed(() => {
  const out = filteredCharts.value.filter((policy) => {
    // Filter official vs. non-official
    if (showKubewardenOfficial.value && !policy.official) {
      return false;
    }

    // Search query filtering
    if (searchQuery.value) {
      const searchTokens = searchQuery.value
        .split(/\s*[, ]\s*/)
        .map(x => ensureRegex(x, false));

      const matchesSearch = searchTokens.every((token) => (
        policy.annotations?.['kubewarden/displayName']?.match(token)
        || (policy.description && policy.description.match(token))
        || policy.keywords?.some((keyword: string) => keyword.match(token))
      ));

      if (!matchesSearch) {
        return false;
      }
    }

    // Attribute filtering
    if (attributes.value.length) {
      if (attributes.value.includes(t('kubewarden.utils.attributes.optionLabels.all'))) {
        // "All" means show all policies
        return true;
      }

      const matchesAttributes = attributes.value.some((attribute) => {
        const isFeature = featureOptions.value.includes(attribute);

        if (isFeature) {
          const normalized = (attribute === 'Mutation') ? 'mutation' : 'contextAwareResources';
          return policy?.annotations?.[`kubewarden/${ normalized }`];
        }

        // Otherwise check resource matches
        return policy?.annotations?.['kubewarden/resources']?.includes(attribute);
      });

      if (!matchesAttributes) {
        return false;
      }
    }

    return true;
  });

  // Sort by 'name'
  return sortBy(out, ['name'], false);
});

/**
 * Build out the attribute options (resource options + feature options).
 */
const attributeOptionsComputed = computed(() => {
  const out: Array<string | { kind: string; label: string }> = [];

  if (resourceOptions.value?.length) {
    out.push(
      {
        kind:  'group',
        label: t('kubewarden.utils.attributes.optionLabels.resource'),
      },
      ...resourceOptions.value
    );
  }

  if (featureOptions.value.length) {
    out.push(
      {
        kind:  'group',
        label: t('kubewarden.utils.attributes.optionLabels.features'),
      },
      ...featureOptions.value
    );
  }

  if (out.length) {
    out.unshift(
      t('kubewarden.utils.attributes.optionLabels.all'),
      { kind: 'divider', label: 'divider' }
    );
  }

  return out;
});

/**
 * List all “features” from the annotations of the charts
 */
const featureOptions = computed<string[]>(() => {
  const featuresList: string[] = [];

  for (const policy of filteredCharts.value) {
    if (policy?.annotations?.['kubewarden/mutation'] === 'true') {
      featuresList.push('Mutation');
    }

    if (policy?.annotations?.['kubewarden/contextAwareResources']) {
      featuresList.push('Context Aware');
    }
  }

  return [...new Set(featuresList.filter(Boolean))];
});

/**
 * Resource options derived from chart annotations
 */
const resourceOptions = computed(() => {
  return resourcesFromAnnotation(filteredCharts.value);
});

function isPrerelease(policyChart: any) {
  const parsed = semver.prerelease(policyChart.version);

  // Special handling for `deprecated-api-versions`
  if (parsed && policyChart.name === 'deprecated-api-versions') {
    return !!parsed.includes('rc');
  }

  return !!parsed;
}

function refresh() {
  category.value = '';
  attributes.value = [t('kubewarden.utils.attributes.optionLabels.all')];
  searchQuery.value = '';
}
</script>

<template>
  <div class="policy-table-container">
    <!-- FILTERS -->
    <div class="filter">
      <LabeledSelect
        v-if="attributeOptionsComputed.length"
        v-model:value="computedAttributes"
        data-testid="kw-table-filter-source"
        :clearable="true"
        :taggable="true"
        :mode="props.mode"
        :multiple="true"
        class="filter__attributes"
        :label="t('kubewarden.utils.attributes.label')"
        :options="attributeOptionsComputed"
      />

      <LabeledInput
        ref="searchQueryInput"
        v-model:value="searchQuery"
        data-testid="kw-table-filter-search"
        :mode="props.mode"
        class="input-sm filter__search"
        :label="t('kubewarden.utils.search')"
        :placeholder="t('kubewarden.generic.name')"
      />

      <button
        data-testid="kw-table-filter-refresh"
        class="btn role-tertiary filter__reset"
        type="button"
        @click="refresh"
      >
        <p>{{ t('kubewarden.utils.resetFilter') }}</p>
      </button>
    </div>

    <!-- ACTIONS -->
    <div class="policy-table-actions">
      <Checkbox
        v-model:value="showKubewardenOfficial"
        :label="t('kubewarden.utils.official.label')"
        data-testid="kw-table-filter-official"
      />

      <button
        data-testid="kw-table-custom-buttom"
        class="btn role-tertiary"
        type="button"
        @click="emit('selectPolicy', 'custom')"
      >
        <p>{{ t('kubewarden.utils.custom.create') }}</p>
      </button>
    </div>

    <!-- TABLE -->
    <SortableTableWrapper
      :rows="filteredPolicies"
      :headers="POLICY_TABLE_HEADERS"
      :table-actions="false"
      :row-actions="false"
      key-field="digest"
      default-sort-by="name"
      :paging="true"
      :search="false"
      @selectRow="(row: any) => emit('selectPolicy', row)"
    />
  </div>
</template>

<style lang="scss" scoped>
.policy-table-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.policy-table-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter {
  width: 100%;
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: repeat(2, 1fr) .25fr;
  grid-template-areas:
    "attributes search reset";
  gap: 1rem;

  & > * {
    margin: 0.5rem 0;
  }

  &__attributes {
    grid-area: attributes;
  }

  &__search {
    grid-area: search;
  }

  &__reset {
    grid-area: reset;

    p {
      line-height: 1.5;
      white-space: wrap;
    }
  }
}

/* Make table rows clickable */
:deep(tr:hover) {
  cursor: pointer;
}
</style>
