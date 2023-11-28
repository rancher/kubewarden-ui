<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import ResourceFetch from '@shell/mixins/resource-fetch';
import { CATALOG } from '@shell/config/types';
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import ServiceNameSelect from '@shell/components/form/ServiceNameSelect';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

import { KUBEWARDEN_CHARTS } from '../../../types';
import { DEFAULT_POLICY_SERVER } from '../../../models/policies.kubewarden.io.policyserver';
import { getLatestStableVersion } from '../../../plugins/kubewarden-class';

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
    Banner, LabeledInput, Loading, RadioGroup, ServiceNameSelect
  },

  mixins: [ResourceFetch],

  async fetch() {
    await this.$initializeFetchData(CATALOG);
    await this.$fetchType(CATALOG.CLUSTER_REPO);
    await this.$store.dispatch('catalog/load');

    if ( this.defaultsChart ) {
      const defaultsStable = getLatestStableVersion(this.defaultsChart.versions);

      const chartInfo = await this.$store.dispatch('catalog/getVersionInfo', {
        repoType:    this.defaultsChart?.repoType,
        repoName:    this.defaultsChart?.repoName,
        chartName:   this.defaultsChart?.chartName,
        versionName: defaultsStable?.version
      });

      if ( !isEmpty(chartInfo) ) {
        const registry = chartInfo.values?.common?.cattle?.systemDefaultRegistry;
        const psImage = chartInfo.values?.policyServer?.image?.repository;
        const psTag = chartInfo.values?.policyServer?.image?.tag;

        if ( psImage && psTag ) {
          this.latestStableVersion = `${ registry || 'ghcr.io' }/${ psImage }:${ psTag }`;
        }
      }
    }

    if ( this.latestStableVersion ) {
      if ( !this.image || this.image === DEFAULT_POLICY_SERVER.spec.image ) {
        // If the image doesn't exist or it's the default 'latest' image, set to the latestStableVersion
        this.image = this.latestStableVersion;
      } else if ( this.image && this.image !== DEFAULT_POLICY_SERVER.spec.image && this.image !== this.latestStableVersion ) {
        // If the image exists, and is not the default 'latest' image, and not the latestStableVersion,
        // set the defaultImage radio to false
        this.defaultImage = false;
      }
    } else if ( this.image && this.image !== DEFAULT_POLICY_SERVER.spec.image ) {
      this.defaultImage = false;
    }
  },

  data() {
    return {
      defaultImage:        true,
      latestStableVersion: null,
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
    defaultImage(neu, old) {
      if ( neu ) {
        if ( this.latestStableVersion ) {
          this.image = this.latestStableVersion;
        } else {
          this.image = structuredClone(DEFAULT_POLICY_SERVER.spec.image);
        }
      }
    }
  },

  computed: {
    ...mapGetters({ charts: 'catalog/charts' }),

    isCreate() {
      return this.mode === _CREATE;
    },

    defaultsChart() {
      if ( this.kubewardenRepo ) {
        return this.$store.getters['catalog/chart']({
          repoName:  this.kubewardenRepo.repoName,
          repoType:  this.kubewardenRepo.repoType,
          chartName: KUBEWARDEN_CHARTS.DEFAULTS
        });
      }

      return null;
    },

    kubewardenRepo() {
      return this.charts?.find(chart => chart.chartName === KUBEWARDEN_CHARTS.DEFAULTS);
    },

    showVersionBanner() {
      return (this.isCreate && this.defaultImage && !this.defaultsChart && !this.latestStableVersion);
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
          v-model="name"
          data-testid="ps-config-name-input"
          :mode="mode"
          :disabled="!isCreate"
          :label="t('nameNsDescription.name.label')"
          :placeholder="t('nameNsDescription.name.placeholder')"
          required
        />
      </div>
    </div>

    <div class="row">
      <div v-if="showVersionBanner" class="col span-12">
        <Banner
          class="mb-20 mt-0"
          color="warning"
          :label="t('kubewarden.policyServerConfig.defaultImage.versionWarning')"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-model="defaultImage"
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
            v-model="image"
            data-testid="ps-config-image-input"
            :mode="mode"
            :label="t('kubewarden.policyServerConfig.image.label')"
            :tooltip="t('kubewarden.policyServerConfig.image.tooltip')"
          />
        </template>
      </div>
    </div>

    <div class="row">
      <div class="col span-12">
        <ServiceNameSelect
          v-model="serviceAccountName"
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
          v-model.number="replicas"
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
