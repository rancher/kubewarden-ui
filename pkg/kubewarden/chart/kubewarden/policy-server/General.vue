<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import ResourceFetch from '@shell/mixins/resource-fetch';
import { CATALOG, FLEET } from '@shell/config/types';
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import ServiceNameSelect from '@shell/components/form/ServiceNameSelect';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

import { KUBEWARDEN_CHARTS, KUBEWARDEN_APPS } from '@kubewarden/types';
import { DEFAULT_POLICY_SERVER } from '@kubewarden/models/policies.kubewarden.io.policyserver';
import { getPolicyServerModule, isFleetDeployment } from '@kubewarden/modules/fleet';
import { findCompatibleDefaultsChart } from '@kubewarden/utils/chart';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      required: true
    },

    serviceAccounts: {
      type:     Array,
      required: true
    }
  },

  components: {
    Banner,
    LabeledInput,
    Loading,
    RadioGroup,
    ServiceNameSelect
  },

  mixins: [ResourceFetch],

  async fetch() {},

  async mounted() {
    this.isLoading = true;

    if (this.$store.getters['cluster/canList'](CATALOG.APP) && this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO)) {
      await this.$initializeFetchData(CATALOG);
      await this.$fetchType(CATALOG.CLUSTER_REPO);

      if (!this.$store.getters['kubewarden/controllerApp']) {
        await this.$fetchType(CATALOG.APP);
      }

      await this.$store.dispatch('catalog/load');

      if (this.controllerApp) {
        this.isFleet = isFleetDeployment(this.controllerApp);

        if (this.isFleet && this.$store.getters['management/all'](FLEET.BUNDLE)) {
          await this.$initializeFetchData(FLEET);
          await this.$store.dispatch('management/findAll', { type: FLEET.BUNDLE });
        }

        if (this.defaultsChart) {
          const compatibleVersion = findCompatibleDefaultsChart(this.controllerApp, this.defaultsChart);

          const chartInfo = await this.$store.dispatch('catalog/getVersionInfo', {
            repoType:    this.defaultsChart?.repoType,
            repoName:    this.defaultsChart?.repoName,
            chartName:   this.defaultsChart?.chartName,
            versionName: compatibleVersion.version
          });

          if (!isEmpty(chartInfo)) {
            const registry = chartInfo.values?.common?.cattle?.systemDefaultRegistry;
            const psImage = chartInfo.values?.policyServer?.image?.repository;
            const psTag = chartInfo.values?.policyServer?.image?.tag;

            if (psImage && psTag) {
              this.latestChartVersion = `${ registry || 'ghcr.io' }/${ psImage }:${ psTag }`;
            }
          }
        }

        if (this.isFleet && !this.defaultsChart) {
          this.latestChartVersion = getPolicyServerModule(this.fleetBundles);
        }

        if (!this.image || (this.isCreate && this.image === DEFAULT_POLICY_SERVER.spec.image)) {
          this.image = this.latestChartVersion || structuredClone(DEFAULT_POLICY_SERVER.spec.image);
        } else if (this.image !== this.latestChartVersion && this.image !== DEFAULT_POLICY_SERVER.spec.image) {
          this.defaultImage = false;
        }

        if (!this.isCreate && this.image) {
          if (this.image === this.latestChartVersion) {
            this.defaultImage = true;
          } else {
            this.defaultImage = false;
          }
        }
      }
    }

    this.isLoading = false;
  },

  data() {
    return {
      isLoading:           false,
      defaultImage:        true,
      latestChartVersion:  null,
      isFleet:             false,
      name:                this.value.metadata.name,
      image:               this.value.spec.image,
      serviceAccountName:  this.value.spec.serviceAccountName,
      replicas:            this.value.spec.replicas
    };
  },

  watch: {
    name(neu) {
      this.$emit('update-general', 'name', neu);
    },
    image(neu) {
      this.$emit('update-general', 'image', neu);
    },
    serviceAccountName(neu) {
      this.$emit('update-general', 'serviceAccountName', neu);
    },
    replicas(neu) {
      this.$emit('update-general', 'replicas', neu);
    },
    defaultImage(neu) {
      if (neu) {
        if (this.latestChartVersion) {
          this.image = this.latestChartVersion;
        } else {
          this.image = structuredClone(DEFAULT_POLICY_SERVER.spec.image);
        }
      }
    }
  },

  computed: {
    ...mapGetters({ charts: 'catalog/charts' }),

    allApps() {
      return this.$store.getters['cluster/all'](CATALOG.APP);
    },

    controllerApp() {
      const storedApp = this.$store.getters['kubewarden/controllerApp'];

      if (!storedApp) {
        const controller = this.allApps?.find((a) => (
          a?.spec?.chart?.metadata?.name === (KUBEWARDEN_CHARTS.CONTROLLER || KUBEWARDEN_APPS.RANCHER_CONTROLLER)
        ));

        if (controller) {
          this.$store.dispatch('kubewarden/updateControllerApp', controller);

          return controller;
        }

        return null;
      }

      return storedApp;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    defaultsChart() {
      if (this.kubewardenRepo && !this.isFleet) {
        return this.$store.getters['catalog/chart']({
          repoName:  this.kubewardenRepo.repoName,
          repoType:  this.kubewardenRepo.repoType,
          chartName: KUBEWARDEN_CHARTS.DEFAULTS
        });
      }

      return null;
    },

    fleetBundles() {
      return this.$store.getters['management/all'](FLEET.BUNDLE);
    },

    kubewardenRepo() {
      return this.charts?.find((chart) => chart.chartName === KUBEWARDEN_CHARTS.DEFAULTS);
    },

    showVersionBanner() {
      if (this.isFleet) {
        return (this.isCreate && this.defaultImage && !this.latestChartVersion);
      }

      return (this.isCreate && this.defaultImage && !this.defaultsChart && !this.latestChartVersion);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
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
      <div v-if="isLoading" data-testid="ps-config-image-loading">
        <i class="icon icon-lg icon-spinner icon-spin  mt-20" />
      </div>
      <template v-else>
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
      </template>
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
