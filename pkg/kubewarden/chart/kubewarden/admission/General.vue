<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { _CREATE } from '@shell/config/query-params';
import { set } from '@shell/utils/object';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

import { KUBEWARDEN, KUBEWARDEN_APPS } from '../../../types';

export default {
  name: 'General',

  inject: ['chartType'],

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },
    targetNamespace: {
      type:     String,
      required: true
    },
    value: {
      type:     Object,
      required: true
    }
  },

  components: {
    LabeledSelect,
    Loading,
    NameNsDescription,
    Banner,
    LabeledInput,
    RadioGroup
  },

  async fetch() {
    await this.$store.dispatch(`${ this.currentProduct.inStore }/findAll`, { type: KUBEWARDEN.POLICY_SERVER });

    if ( this.isCreate && !isEmpty(this.policy.spec) ) {
      set(this.policy.spec, 'mode', 'protect');
    }

    if ( this.isCreate && !isEmpty(this.policyServers) ) {
      const defaultPolicyServer = this.policyServers.find((ps) => {
        return ps.metadata.annotations?.['meta.helm.sh/release-name'] === KUBEWARDEN_APPS.RANCHER_DEFAULTS;
      });

      this.policy.spec.policyServer = defaultPolicyServer?.id;
    }
  },

  data() {
    let policy = null;

    if ( this.value?.policy ) {
      policy = this.value.policy;
    } else {
      policy = this.value || {};
    }

    return {
      policy,
      initialPolicyMode: null,
    };
  },

  created() {
    if ( this.policyMode ) {
      this.initialPolicyMode = this.policyMode;
    }
  },

  computed: {
    ...mapGetters(['currentProduct']),

    isCreate() {
      return this.mode === _CREATE;
    },

    isGlobal() {
      return this.chartType === KUBEWARDEN.CLUSTER_ADMISSION_POLICY;
    },

    modeDisabled() {
      // Kubewarden doesn't allow switching a policy from 'protect' to 'monitor'
      if ( !this.isCreate ) {
        return this.initialPolicyMode === 'protect';
      }

      return false;
    },

    policyMode() {
      return this.value?.policy?.spec?.mode;
    },

    policyServers() {
      return this.$store.getters[`${ this.currentProduct.inStore }/all`](KUBEWARDEN.POLICY_SERVER);
    },

    policyServerOptions() {
      if ( this.policyServers?.length > 0 ) {
        const out = [];

        this.policyServers.map(p => out.push(p.id));

        return out;
      }

      return this.policyServers || [];
    },

    showModeBanner() {
      if ( !this.isCreate && ( this.initialPolicyMode === 'monitor' && this.policyMode === 'protect' ) ) {
        return true;
      }

      return false;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else>
    <div class="row">
      <div class="col span-12">
        <NameNsDescription
          data-testid="kw-policy-general-name-input"
          :mode="mode"
          :value="policy"
          :description-hidden="true"
          :namespaced="!isGlobal"
          name-key="metadata.name"
          namespace-key="metadata.namespace"
        />
      </div>
    </div>
    <template v-if="policy.spec">
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="policy.spec.policyServer"
            data-testid="kw-policy-general-ps-input"
            :value="value"
            :mode="mode"
            :options="policyServerOptions"
            :label="t('kubewarden.policyConfig.serverSelect.label')"
            :tooltip="t('kubewarden.policyConfig.serverSelect.tooltip')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="policy.spec.module"
            data-testid="kw-policy-general-module-input"
            :mode="mode"
            :label="t('kubewarden.policyConfig.module.label')"
            :tooltip="t('kubewarden.policyConfig.module.tooltip')"
            :required="true"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <RadioGroup
            v-model="policy.spec.mode"
            data-testid="kw-policy-general-mode-input"
            name="mode"
            :disabled="modeDisabled"
            :options="['monitor', 'protect']"
            :mode="mode"
            :label="t('kubewarden.policyConfig.mode.label')"
            :labels="['Monitor', 'Protect']"
            :tooltip="t('kubewarden.policyConfig.mode.tooltip')"
          />
          <Banner
            v-if="showModeBanner"
            data-testid="kw-policy-general-mode-banner"
            color="warning"
            :label="t('kubewarden.policyConfig.mode.warning')"
          />
        </div>
      </div>
    </template>
  </div>
</template>
