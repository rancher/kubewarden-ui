<script setup lang="ts">
import {
  ref, computed, onMounted, watch, watchEffect
} from 'vue';
import { useStore } from 'vuex';
import { V1ServiceAccount } from '@kubernetes/client-node';

import { CATALOG, FLEET } from '@shell/config/types';
import { _CREATE } from '@shell/config/query-params';

import {
  PolicyServer,
  CatalogApp,
  ClusterRepo,
  Chart,
  FleetBundle,
  KUBEWARDEN_REPO,
  KUBEWARDEN_CHARTS_REPO,
  KUBEWARDEN_CHARTS_REPO_GIT,
  KUBEWARDEN_CHARTS,
} from '../../../types';
import { findCompatibleDefaultsChart } from '../../../utils/chart';
import { getPolicyServerModule, isFleetDeployment } from '../../../modules/fleet';
import { DEFAULT_POLICY_SERVER } from '../../../models/policies.kubewarden.io.policyserver';

import Loading from '@shell/components/Loading';
import ServiceNameSelect from '@shell/components/form/ServiceNameSelect';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

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
const name = ref(props.value?.metadata?.name);
const image = ref(props.value?.spec?.image);
const serviceAccountName = ref(props.value?.spec?.serviceAccountName);
const replicas = ref(props.value?.spec?.replicas);
const kubewardenRepo = ref<ClusterRepo | null>(null);
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

      if (!image.value || (isCreate.value && image.value === DEFAULT_POLICY_SERVER.spec.image)) {
        image.value = latestChartVersion.value || DEFAULT_POLICY_SERVER.spec.image;
      } else if (image.value !== latestChartVersion.value && image.value !== DEFAULT_POLICY_SERVER.spec.image) {
        defaultImage.value = false;
      }

      if (!isCreate.value && image.value) {
        defaultImage.value = image.value === latestChartVersion.value;
      }
    }
  }

  isLoading.value = false;
}

onMounted(fetchData);

watch([defaultImage, latestChartVersion], ([defaultImg, latest]) => {
  if (defaultImg) {
    image.value = latest || DEFAULT_POLICY_SERVER.spec.image;
  }
});

watchEffect(() => {
  if (allRepos.value.length) {
    const OFFICIAL_REPOS = [
      KUBEWARDEN_REPO,
      KUBEWARDEN_CHARTS_REPO,
      KUBEWARDEN_CHARTS_REPO_GIT
    ];

    kubewardenRepo.value = allRepos.value.find((r) => r.spec?.url && OFFICIAL_REPOS.includes(r.spec?.url)) || null;
  }
});

watchEffect(() => {
  if (kubewardenRepo.value && !isFleet.value) {
    defaultsChart.value = store.getters['catalog/chart']({
      repoName:  kubewardenRepo.value.metadata?.name,
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
          v-model:value="name"
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
              v-model:value="image"
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
          v-model:value="serviceAccountName"
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
          v-model:value.number="replicas"
          data-testid="ps-config-replicas-input"
          type="number"
          min="0"
          required
          :mode="mode"
          :label="t('kubewarden.policyServerConfig.replicas')"
        />
      </div>
    </div>
  </div>
</template>
