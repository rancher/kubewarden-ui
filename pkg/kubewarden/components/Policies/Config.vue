<script setup lang="ts">
import { ref, onBeforeMount, onMounted, toRaw } from 'vue';
import { useStore } from 'vuex';
import merge from 'lodash/merge';

import { CATALOG } from '@shell/config/types';
import { saferDump } from '@shell/utils/create-yaml';
import { set } from '@shell/utils/object';

import Loading from '@shell/components/Loading.vue';

import { Chart, Version, VersionInfo, KUBEWARDEN_ANNOTATIONS } from '../../types';
import Values from './Values.vue';
import PolicyReadmePanel from './PolicyReadmePanel.vue';

interface Props {
  mode: string;
  value: Record<string, any>;
}

interface MatchingPolicyDetail {
  versionInfo?: VersionInfo;
  matches: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['updateYamlValues']);
const store = useStore();
const t = store.getters['i18n/t'];

const selectedPolicyDetails = ref<any>(null);
const chartValues = ref<any>(null);
const yamlValues = ref('');
const shortDescription = ref('');
const policyReadme = ref<any>(null);

const fetchPending = ref(true);

async function loadFromAnnotations(chartKey: string, chartName: string, chartVersion: string) {
  if (!chartKey && (!chartName || !chartVersion)) {
    console.warn('No chart details found in annotations');

    return;
  }

  let chart: any | null = null;
  let version: any = null;

  if (chartKey) {
    chart = toRaw(store.getters['catalog/chart']({ key: chartKey }));
  }

  if (chart) {
    version = chart?.versions?.find((v: any) => v.version === chartVersion);
  } else {
    // Fallback: find chart by filtering
    const kwCharts = toRaw(store.getters['catalog/charts'].filter((c: Chart) => c.chartType === 'kubewarden-policy'));
    chart = kwCharts.find((c: any) => c.chartName === chartName);
    version = chart?.versions?.find((v: any) => v.version === chartVersion);
  }

  if (version) {
    try {
      const versionInfo = await store.dispatch('catalog/getVersionInfo', {
        repoType: version.repoType,
        repoName: version.repoName,
        chartName,
        versionName: version.version
      });

      processChartDetails(toRaw(versionInfo));
    } catch (e) {
      console.warn('Failed to load chart version:', e);
    }
  }
}

async function loadFromModule() {
  const module = props.value.spec?.module;

  if (!module) {
    return;
  }

  const [repo, tag] = module.split(':');
  const charts: Chart[] = store.getters['catalog/charts'].filter((c: Chart) => c.chartType === 'kubewarden-policy');

  for (const chart of charts) {
    if (chart?.versions?.length === 0) {
      continue;
    }
    
    // Process all versions of the current chart in parallel
    const versionPromises = chart?.versions?.map(async (version: Version) => {
      try {
        const versionInfo: VersionInfo = await store.dispatch('catalog/getVersionInfo', {
          repoType: version.repoType,
          repoName: version.repoName,
          chartName: chart.chartName,
          versionName: version.version
        });
        const rawVersionInfo = toRaw(versionInfo);

        return {
          versionInfo: rawVersionInfo,
          matches: rawVersionInfo.values?.spec?.module?.repository === repo &&
                   rawVersionInfo.values?.spec?.module?.tag === tag
        };
      } catch (e) {
        console.warn('Error loading version:', e);

        return { matches: false };
      }
    });

    if (!versionPromises?.length) {
      continue;
    }

    const results: MatchingPolicyDetail[] = await Promise.all(versionPromises);

    const matchingResult = results?.find(result => result?.matches);

    if (matchingResult && matchingResult.versionInfo) {
      processChartDetails(matchingResult.versionInfo);

      return;
    }
  }
}

function processChartDetails(versionInfo: VersionInfo) {
  selectedPolicyDetails.value = versionInfo;
  shortDescription.value = versionInfo?.chart?.description || '';
  policyReadme.value = versionInfo?.readme;

  if (versionInfo.values?.spec?.settings) {
    const merged = merge({}, versionInfo.values.spec.settings, chartValues.value?.policy.spec.settings);
    set(chartValues.value?.policy.spec, 'settings', merged);
  }

  if (versionInfo.questions) {
    set(chartValues.value, 'questions', versionInfo.questions);
  }
}

const readmePanel = ref<InstanceType<typeof PolicyReadmePanel> | null>(null);

function showReadme() {
  readmePanel.value?.show();
}

onBeforeMount(async () => {
  const isReposLoaded = store.getters['catalog/repos']?.length > 0;

  if (!isReposLoaded && store.getters['cluster/canList'](CATALOG.CLUSTER_REPO)) {
    await store.dispatch('cluster/findAll', { type: CATALOG.CLUSTER_REPO });
  }

  const isChartsLoaded = store.getters['catalog/charts']?.length > 0;

  if (!isChartsLoaded) {
    await store.dispatch('catalog/refresh');
  }
});

onMounted(async () => {
  chartValues.value = { policy: props.value, questions: null };

  // Try annotations first
  const chartKey     = props.value?.metadata?.annotations?.[KUBEWARDEN_ANNOTATIONS.CHART_KEY];
  const chartName    = props.value?.metadata?.annotations?.[KUBEWARDEN_ANNOTATIONS.CHART_NAME];
  const chartVersion = props.value?.metadata?.annotations?.[KUBEWARDEN_ANNOTATIONS.CHART_VERSION];

  if (chartKey || (chartName && chartVersion)) {
    await loadFromAnnotations(chartKey, chartName, chartVersion);
  } else {
    await loadFromModule();
  }

  yamlValues.value = saferDump(props.value);

  fetchPending.value = false;
});
</script>

<template>
  <Loading v-if="fetchPending" />
  <div v-else>
    <div class="content">
      <div v-if="shortDescription" class="banner__title">
        <p class="banner__short-description">
          {{ shortDescription }}
        </p>
        <button
          v-if="policyReadme"
          class="btn btn-sm role-link banner__readme-button"
          @click="showReadme"
        >
          {{ t('kubewarden.policyConfig.description.showReadme') }}
        </button>
      </div>

      <Values
        :value="props.value"
        :chart-values="chartValues"
        :yaml-values="yamlValues"
        :mode="props.mode"
        @updateYamlValues="val => emit('updateYamlValues', val)"
      />
    </div>

    <template v-if="policyReadme">
      <PolicyReadmePanel
        ref="readmePanel"
        :policy-chart-details="selectedPolicyDetails"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.content {
  position: relative;
  z-index: 1;
}

.banner {
  &__title {
    padding-top: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--border);
    min-height: 60px;
  }

  &__readme-button {
    padding: 0 7px 0 0;
  }
}
</style>
