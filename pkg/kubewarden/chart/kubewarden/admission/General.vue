<script>
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
    isCustom: {
      type:    Boolean,
      default: false
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
    if ( this.$store.getters['cluster/canList'](KUBEWARDEN.POLICY_SERVER) ) {
      await this.$store.dispatch('cluster/findAll', { type: KUBEWARDEN.POLICY_SERVER });
    }

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

    // fix for https://github.com/rancher/kubewarden-ui/issues/672
    // enforce `default` as namespace for creation of AP's
    if ( this.mode === _CREATE && this.chartType === KUBEWARDEN.ADMISSION_POLICY ) {
      set(policy.metadata, 'namespace', 'default');
    }

    return {
      policy,
      initialPolicyMode: null,
      isNamespaceNew:    false
    };
  },

  watch: {
    isNamespaceNew(neu) {
      this.value.isNamespaceNew = neu;
    }
  },

  created() {
    if ( this.policyMode ) {
      this.initialPolicyMode = this.policyMode;
    }
  },

  beforeUpdate() {
    this.$nextTick(() => {
      // In order to fix the layout of the NameNsDescription component
      // we need to adjust the classes of the child elements
      const wrapper = this.$refs?.nameNsDescriptionWrapper;

      const children = wrapper?.querySelectorAll('.row.mb-20 > .col.span-3');

      if ( this.isGlobal ) {
        if ( children?.length === 1 ) {
          children[0].classList.remove('span-3');
          children[0].classList.add('span-12');
        }
      } else if ( children?.length === 2 ) {
        children[0].classList.remove('span-3');
        children[0].classList.add('span-4');
        children[1].classList.remove('span-3');
        children[1].classList.add('span-8');
      }
    });
  },

  computed: {
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
      return this.$store.getters['cluster/all'](KUBEWARDEN.POLICY_SERVER);
    },

    policyServerOptions() {
      if ( this.policyServers?.length > 0 ) {
        const out = [];

        this.policyServers.map((p) => out.push(p.id));

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
      <div ref="nameNsDescriptionWrapper" class="col span-6 name-col">
        <NameNsDescription
          data-testid="kw-policy-general-name-input"
          :mode="mode"
          :value="policy"
          :description-hidden="true"
          :namespaced="!isGlobal"
          :namespace-new-allowed="true"
          :required="true"
          name-key="metadata.name"
          namespace-key="metadata.namespace"
          @isNamespaceNew="isNamespaceNew = $event"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model:value="policy.spec.policyServer"
          data-testid="kw-policy-general-ps-input"
          :value="value"
          :mode="mode"
          :options="policyServerOptions"
          :disabled="!isCreate"
          :label="t('kubewarden.policyConfig.serverSelect.label')"
          :tooltip="t('kubewarden.policyConfig.serverSelect.tooltip')"
        />
      </div>
    </div>
    <template v-if="policy.spec">
      <div class="row mb-20">
        <div v-if="isCustom" class="col span-12">
          <LabeledInput
            v-model:value="policy.spec.module"
            data-testid="kw-policy-general-module-input"
            :mode="mode"
            :label="t('kubewarden.policyConfig.module.label')"
            :tooltip="t('kubewarden.policyConfig.module.tooltip')"
            :placeholder="t('kubewarden.policyConfig.module.placeholder')"
            :required="true"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <RadioGroup
            v-model:value="policy.spec.mode"
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
        <div class="col span-6">
          <RadioGroup
            v-model:value="policy.spec.backgroundAudit"
            data-testid="kw-policy-general-background-audit-input"
            name="mode"
            :options="[true, false]"
            :mode="mode"
            :label="t('kubewarden.policyConfig.backgroundAudit.label')"
            :labels="['On', 'Off']"
            :tooltip="t('kubewarden.policyConfig.backgroundAudit.tooltip')"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.name-col div:before, .name-col div:after {
  content: unset;
  display: unset;
}
</style>
