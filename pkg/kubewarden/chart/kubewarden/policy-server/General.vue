<script setup lang="ts">
import { V1ServiceAccount } from '@kubernetes/client-node';
import {
  computed, onMounted, ref, watch, watchEffect
} from 'vue';
import { useStore } from 'vuex';

import { _CREATE } from '@shell/config/query-params';
import { CATALOG, FLEET } from '@shell/config/types';

import { DEFAULT_POLICY_SERVER } from '@kubewarden/models/policies.kubewarden.io.policyserver';
import { getPolicyServerModule, isFleetDeployment } from '@kubewarden/modules/fleet';
import {
  CatalogApp,
  Chart,
  ClusterRepo,
  FleetBundle,
  KUBEWARDEN_CHARTS,
  KUBEWARDEN_REPOS,
  PolicyServer
} from '@kubewarden/types';
import { findCompatibleDefaultsChart } from '@kubewarden/utils/chart';

import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import Loading from '@shell/components/Loading';
import ServiceNameSelect from '@shell/components/form/ServiceNameSelect';

const props = defineProps<{
  mode?: string;
  value: PolicyServer;
  serviceAccounts: V1ServiceAccount[];
}>();

const store = useStore();
const t = store.getters['i18n/t'];

const isLoading = ref(false);
const defaultImage = ref(true);
const latestChartVersion = ref<string | null>(null);
const isFleet = ref(false);
const kubewardenChartsRepo = ref<ClusterRepo | null>(null);
const kubewardenPolicyCatalogRepo = ref<ClusterRepo | null>(null);
const defaultsChart = ref<Chart | null>(null);

const isCreate = computed(() => props.mode === _CREATE);
const allApps = computed<CatalogApp[]>(() => store.getters['cluster/all'](CATALOG.APP));
const allRepos = computed<ClusterRepo[]>(() => store.getters['cluster/all'](CATALOG.CLUSTER_REPO));
const controllerApp = computed<CatalogApp>(() => store.getters['kubewarden/controllerApp']);
const fleetBundles = computed<FleetBundle[]>(() => store.getters['management/all'](FLEET.BUNDLE));

const showVersionBanner = computed(() => {
  if (isFleet.value) {
    return isCreate.value && defaultImage.value && !latestChartVersion.value;
  }

  return isCreate.value && defaultImage.value && !defaultsChart?.value && !latestChartVersion.value;
});

async function fetchData() {
  isLoading.value = true;

  if (
    store.getters['cluster/canList'](CATALOG.APP) &&
    store.getters['cluster/canList'](CATALOG.CLUSTER_REPO)
  ) {
    await Promise.all([
      store.dispatch('catalog/load'),
      store.dispatch('cluster/findAll', { type: CATALOG.CLUSTER_REPO }),
      !store.getters['kubewarden/controllerApp'] && store.dispatch('cluster/findAll', { type: CATALOG.APP })
    ]);

    if (controllerApp.value) {
      isFleet.value = isFleetDeployment(controllerApp.value);

      if (isFleet.value && store.getters['management/all'](FLEET.BUNDLE)) {
        await store.dispatch('management/findAll', { type: FLEET.BUNDLE });
      }

      if (defaultsChart?.value) {
        const compatibleVersion = findCompatibleDefaultsChart(controllerApp.value, defaultsChart.value);

        if (compatibleVersion) {
          const chartInfo = await store.dispatch('catalog/getVersionInfo', {
            repoType:    defaultsChart.value.repoType,
            repoName:    defaultsChart.value.repoName,
            chartName:   defaultsChart.value.chartName,
            versionName: compatibleVersion.version,
          });

          if (chartInfo) {
            const registry = chartInfo.values?.common?.cattle?.systemDefaultRegistry || 'ghcr.io';
            const psImage = chartInfo.values?.policyServer?.image?.repository;
            const psTag = chartInfo.values?.policyServer?.image?.tag;

            if (psImage && psTag) {
              latestChartVersion.value = `${ registry }/${ psImage }:${ psTag }`;
            }
          }
        } else {
          console.warn('No compatible version found for the default chart');
        }
      }

      if (isFleet.value && !defaultsChart?.value) {
        latestChartVersion.value = getPolicyServerModule(fleetBundles.value);
      }

      if (!props.value?.spec?.image || (isCreate.value && props.value?.spec?.image === DEFAULT_POLICY_SERVER.spec.image)) {
        Object.assign(props.value?.spec, { image: latestChartVersion.value || DEFAULT_POLICY_SERVER.spec.image });
      } else if (props.value?.spec?.image !== latestChartVersion.value && props.value?.spec?.image !== DEFAULT_POLICY_SERVER.spec.image) {
        defaultImage.value = false;
      }

      if (!isCreate.value && props.value?.spec?.image) {
        defaultImage.value = props.value?.spec?.image === latestChartVersion.value;
      }
    }
  }

  isLoading.value = false;
}

onMounted(fetchData);

watch([defaultImage, latestChartVersion], ([defaultImg, latest]) => {
  if (defaultImg) {
    Object.assign(props.value?.spec, { image: latest || DEFAULT_POLICY_SERVER.spec.image });
  }
});

watchEffect(() => {
  if (allRepos.value.length) {
    const OFFICIAL_CHART_REPOS = [
      KUBEWARDEN_REPOS.CHARTS,
      KUBEWARDEN_REPOS.CHARTS_REPO,
      KUBEWARDEN_REPOS.CHARTS_REPO_GIT
    ];
    const OFFICIAL_CATALOG_REPOS = [
      KUBEWARDEN_REPOS.POLICY_CATALOG,
      KUBEWARDEN_REPOS.POLICY_CATALOG_REPO,
      KUBEWARDEN_REPOS.POLICY_CATALOG_REPO_GIT
    ];

    kubewardenChartsRepo.value = allRepos.value.find((r) => r.spec?.url && OFFICIAL_CHART_REPOS.includes(r.spec?.url)) || null;
    kubewardenPolicyCatalogRepo.value = allRepos.value.find((r) => r.spec?.url && OFFICIAL_CATALOG_REPOS.includes(r.spec?.url)) || null;
  }
});

watchEffect(() => {
  if (kubewardenChartsRepo.value && !isFleet.value) {
    defaultsChart.value = store.getters['catalog/chart']({
      repoName:  kubewardenChartsRepo.value.metadata?.name,
      repoType:  'cluster',
      chartName: KUBEWARDEN_CHARTS.DEFAULTS,
    });
  }
}
);

watchEffect(() => {
  if (!controllerApp.value && allApps.value.length) {
    const controller = allApps.value.find(
      (a) => a.spec?.chart?.metadata?.name === 'kubewarden-controller'
    );

    if (controller) {
      store.dispatch('kubewarden/updateControllerApp', controller);
    }
  }
});
</script>

<template>
  <Loading v-if="isLoading" data-testid="ps-general-loading" />
  <div v-else>
    <div class="row mt-10">
      <div class="col span-6 mb-20">
        <LabeledInput
          v-model:value="value.metadata.name"
          data-testid="ps-config-name-input"
          :mode="mode"
          :disabled="!isCreate"
          :label="t('nameNsDescription.name.label')"
          :placeholder="t('nameNsDescription.name.placeholder')"
          :required="true"
        />
      </div>
    </div>

    <div id="image-container">
      <div class="row">
        <div v-if="showVersionBanner" class="col span-12">
          <Banner
            class="mb-20 mt-0"
            color="warning"
            :label="t('kubewarden.policyServerConfig.defaultImage.versionWarning')"
          />
        </div>
      </div>

      <div class="row" data-testid="ps-config-image-inputs">
        <div class="col span-6">
          <RadioGroup
            v-model:value="defaultImage"
            data-testid="ps-config-default-image-button"
            name="defaultImage"
            :options="[true, false]"
            :mode="mode"
            class="mb-10"
            :label="t('kubewarden.policyServerConfig.defaultImage.label')"
            :labels="['Yes', 'No']"
            :tooltip="t('kubewarden.policyServerConfig.defaultImage.tooltip')"
          />
          <template v-if="!defaultImage">
            <LabeledInput
              v-model:value="value.spec.image"
              data-testid="ps-config-image-input"
              :mode="mode"
              :label="t('kubewarden.policyServerConfig.image.label')"
              :tooltip="t('kubewarden.policyServerConfig.image.tooltip')"
            />
          </template>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col span-12">
        <ServiceNameSelect
          v-model:value="value.spec.serviceAccountName"
          data-testid="ps-config-service-account-input"
          :mode="mode"
          :select-label="t('workload.serviceAccountName.label')"
          :select-placeholder="t('workload.serviceAccountName.label')"
          :options="serviceAccounts"
          :default-option="value.spec.serviceAccountName"
          option-label="id"
          option-key="metadata.uid"
        />
      </div>
    </div>
    <div class="spacer"></div>

    <div class="row">
      <div class="col span-6">
        <h3>
          {{ t('kubewarden.policyServerConfig.replicas') }}
        </h3>
        <LabeledInput
          v-model:value.number="value.spec.replicas"
          data-testid="ps-config-replicas-input"
          type="number"
          min="0"
          required
          :mode="mode"
          :label="t('kubewarden.policyServerConfig.replicas')"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-6">
      <ResourceLabeledSelect
        v-model:value="value.spec.priorityClassName"
        data-testid="ps-config-priority-class-name-select"
        :mode="mode"
        resource-type="PriorityClass"
        :label="t('kubewarden.policyServerConfig.priorityClassName.label')"
      />
      </div>
    </div>
  </div>
</template>
