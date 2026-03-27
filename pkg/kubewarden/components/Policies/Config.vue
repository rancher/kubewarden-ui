<script setup lang="ts">
import { onBeforeMount, onMounted, ref, toRaw } from 'vue';
import { useStore } from 'vuex';

import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { saferDump } from '@shell/utils/create-yaml';
import { set } from '@shell/utils/object';

import Loading from '@shell/components/Loading.vue';

import {
  Chart, Version, VersionInfo, KUBEWARDEN_ANNOTATIONS, KUBEWARDEN_CATALOG_ANNOTATIONS
} from '@kubewarden/types';
import { PolicyModuleInfo, parseModuleString, parsePolicyModule, buildModuleString } from '@kubewarden/modules/policyChart';

import PolicyReadmePanel from './PolicyReadmePanel.vue';
import Values from './Values.vue';

interface Props {
  mode: string;
  value: Record<string, any>;
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
const moduleInfo = ref<PolicyModuleInfo | null>(null);

const fetchPending = ref(true);
const errorFetchingPolicy = ref(false);

const systemDefaultRegistry = store.getters['management/byId'](MANAGEMENT.SETTING, 'system-default-registry');

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
    const charts = store.getters['catalog/charts'] as Chart[];

    chart = charts.find((c) => c.chartType === 'kubewarden-policy' && c.chartName === chartName);
    version = chart?.versions?.find((v: Version) => v.version === chartVersion);
  }

  if (version) {
    try {
      const versionInfo = await store.dispatch('catalog/getVersionInfo', {
        repoType:    version.repoType,
        repoName:    version.repoName,
        chartName,
        versionName: version.version
      });

      processChartDetails(toRaw(versionInfo));
    } catch (e) {
      console.warn('Failed to load chart version:', e);

      errorFetchingPolicy.value = true;
    }
  }
}

async function loadFromModule() {
  const module = props.value.spec?.module;
  const parsedModule = parseModuleString(module);

  if (!module || !parsedModule) {
    return;
  }

  const charts: Chart[] = store.getters['catalog/charts'].filter((c: Chart) => c.chartType === 'kubewarden-policy');

  let matchingChart = null;
  let matchingVersion = null;

  chartLoop:
  for (const chart of charts) {
    if (!chart?.versions?.length) {
      continue;
    }

    for (const version of chart.versions) {
      const annotations = version.annotations || {};
      const repositoryFromAnnotations = annotations[KUBEWARDEN_CATALOG_ANNOTATIONS.REPOSITORY];
      const tagFromAnnotations = annotations[KUBEWARDEN_CATALOG_ANNOTATIONS.TAG];

      if (!repositoryFromAnnotations || !tagFromAnnotations) {
        continue;
      }

      const candidates = [
        buildModuleString(annotations[KUBEWARDEN_CATALOG_ANNOTATIONS.REGISTRY] || '', repositoryFromAnnotations, tagFromAnnotations),
        buildModuleString(systemDefaultRegistry?.value || '', repositoryFromAnnotations, tagFromAnnotations),
        buildModuleString('', repositoryFromAnnotations, tagFromAnnotations)
      ];

      if (
        candidates.includes(module) ||
        (repositoryFromAnnotations === parsedModule.repository && tagFromAnnotations === parsedModule.tag)
      ) {
        matchingChart = chart;
        matchingVersion = version;

        break chartLoop;
      }
    }
  }

  if (matchingChart && matchingVersion) {
    try {
      const versionInfo: VersionInfo = await store.dispatch('catalog/getVersionInfo', {
        repoType:    matchingVersion.repoType,
        repoName:    matchingVersion.repoName,
        chartName:   matchingChart.chartName,
        versionName: matchingVersion.version
      });

      processChartDetails(toRaw(versionInfo));
    } catch (e) {
      console.warn('Failed to fetch version info:', e);
      errorFetchingPolicy.value = true;
    }
  }
}

/**
 * Resolve module info for the policy, prioritizing chart info, then the saved spec.module.
 * When chart info is available we use its repository:tag as an unambiguous anchor to extract
 * the registry from spec.module — no hostname heuristics needed, so registries without dots
 * (e.g. "myregistry" or "1") are handled correctly.
 * @param versionInfo
 */
function resolveModuleInfo(versionInfo: VersionInfo): PolicyModuleInfo | null {
  const chartModuleInfo = parsePolicyModule(versionInfo);
  const savedModule     = props.value?.spec?.module || '';

  if (!chartModuleInfo) {
    // No chart info — fall back to hostname-based detection of the saved module string
    const savedModuleInfo = parseModuleString(savedModule);

    return savedModuleInfo ? {
      ...savedModuleInfo,
      source: 'annotations'
    } : null;
  }

  // Use the chart's canonical repository:tag as an anchor to peel the registry off
  // the front of spec.module without any hostname guessing.
  const expectedSuffix = `${ chartModuleInfo.repository }:${ chartModuleInfo.tag }`;

  if (savedModule === expectedSuffix) {
    // Saved without a registry — keep the chart's default registry
    return { ...chartModuleInfo };
  }

  if (savedModule.endsWith(`/${ expectedSuffix }`)) {
    // Saved with a registry prefix; everything before the final "/<repo>:<tag>" is the registry
    const savedRegistry = savedModule.slice(0, -(expectedSuffix.length + 1));

    return {
      ...chartModuleInfo,
      registry: savedRegistry || chartModuleInfo.registry
    };
  }

  // User changed repository or tag from the chart defaults — anchor no longer matches.
  // Split at first '/' (registry boundary) and last ':' (tag boundary) unconditionally,
  // so registries without dots (e.g. "1" or "111111") are preserved correctly.
  const lastColon = savedModule.lastIndexOf(':');

  if (lastColon > 0 && lastColon < savedModule.length - 1) {
    const repoWithRegistry = savedModule.slice(0, lastColon);
    const tag              = savedModule.slice(lastColon + 1);
    const firstSlash       = repoWithRegistry.indexOf('/');
    const registry         = firstSlash >= 0 ? repoWithRegistry.slice(0, firstSlash) : '';
    const repository       = firstSlash >= 0 ? repoWithRegistry.slice(firstSlash + 1) : repoWithRegistry;

    return {
      registry,
      repository,
      tag,
      source: chartModuleInfo.source,
    };
  }

  return chartModuleInfo;
}

function processChartDetails(versionInfo: VersionInfo) {
  selectedPolicyDetails.value = versionInfo;
  shortDescription.value = versionInfo?.chart?.description || '';
  policyReadme.value = versionInfo?.readme;
  moduleInfo.value = resolveModuleInfo(versionInfo);

  if (versionInfo.questions) {
    set(chartValues.value, 'questions', versionInfo.questions);
  }
}

const readmePanel = ref<InstanceType<typeof PolicyReadmePanel> | null>(null);

function showReadme() {
  readmePanel.value?.show();
}

onBeforeMount(async() => {
  const isReposLoaded = store.getters['catalog/repos']?.length > 0;

  if (!isReposLoaded && store.getters['cluster/canList'](CATALOG.CLUSTER_REPO)) {
    await store.dispatch('cluster/findAll', { type: CATALOG.CLUSTER_REPO });
  }

  const isChartsLoaded = store.getters['catalog/charts']?.length > 0;

  if (!isChartsLoaded) {
    await store.dispatch('catalog/refresh');
  }
});

onMounted(async() => {
  chartValues.value = {
    policy:    props.value,
    questions: null
  };

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
        :error-fetching-policy="errorFetchingPolicy"
        :module-info="moduleInfo"
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
