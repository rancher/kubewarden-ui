<script>
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

  mixins: [ResourceFetch],

  components: {
    Banner, LabeledInput, Loading, RadioGroup, ServiceNameSelect
  },

  async fetch() {
    if ( this.isCreate ) {
      await this.$initializeFetchData(CATALOG);
      await this.$fetchType(CATALOG.CLUSTER_REPO);

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

          if ( registry && psImage && psTag ) {
            this.latestStableVersion = `${ registry }/${ psImage }:${ psTag }`;
            this.$set(this.value.spec, 'image', this.latestStableVersion);
          }
        }
      }
    }
  },

  data() {
    return { defaultImage: true, latestStableVersion: null };
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    defaultsChart() {
      return this.$store.getters['catalog/chart']({ chartName: KUBEWARDEN_CHARTS.DEFAULTS });
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
          v-model="value.metadata.name"
          data-testid="ps-config-name-input"
          :mode="mode"
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
            v-model="value.spec.image"
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
          v-model="value.spec.serviceAccountName"
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
          v-model.number="value.spec.replicas"
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
