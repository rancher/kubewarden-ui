<script>
import { _CREATE } from '@shell/config/query-params';
import { set } from '@shell/utils/object';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

import { KUBEWARDEN, KUBEWARDEN_KIND } from '../../../types';
import NamespaceNameInput from '../../../components/NamespaceNameInput';

export default {
  inject: ['chartType'],

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },
    value: {
      type:     Object,
      required: true
    }
  },

  components: {
    LabeledSelect,
    LabeledInput,
    NamespaceNameInput,
    RadioGroup
  },

  created() {
    console.log('### chartType: ', this.chartType);
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
      namespaced:     true,
      isNamespaceNew: false
    };
  },

  beforeMount() {
    if ( this.chartType !== KUBEWARDEN.ADMISSION_POLICY ) {
      this.namespaced = false;
    }
  },

  watch: {
    isNamespaceNew(neu) {
      this.$set(this.value, 'isNamespaceNew', neu);
    },

    namespaced(neu) {
      if ( !neu ) {
        // ClusterAdmissionPolicy
        this.$set(this.policy, 'kind', KUBEWARDEN_KIND.CLUSTER_ADMISSION_POLICY);
        this.$set(this.policy.metadata, 'namespace', undefined);
        this.$set(
          this.policy.spec,
          'namespaceSelector',
          {
            matchExpressions: [],
            matchLabels:      {}
          }
        );
      } else {
        // AdmissionPolicy
        this.$set(this.policy, 'kind', KUBEWARDEN_KIND.ADMISSION_POLICY);
        this.$set(this.policy.spec, 'namespaceSelector', undefined);
      }
    }
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    isGlobal() {
      return this.chartType === KUBEWARDEN.CLUSTER_ADMISSION_POLICY;
    },

    policyServers() {
      return this.$store.getters['cluster/all'](KUBEWARDEN.POLICY_SERVER);
    },

    policyServerOptions() {
      if ( this.policyServers?.length > 0 ) {
        const out = [];

        this.policyServers.map(p => out.push(p.id));

        return out;
      }

      return this.policyServers || [];
    },
  }
};
</script>

<template>
  <div class="mb-20">
    <RadioGroup
      v-if="isCreate"
      v-model="namespaced"
      data-testid="kw-policy-basic-namespaced-radio"
      name="namespaced"
      :options="[true, false]"
      :mode="mode"
      class="mb-10"
      :labels="[t('kubewarden.policyConfig.basic.namespacedRadio.namespaced'), t('kubewarden.policyConfig.basic.namespacedRadio.cluster')]"
    />

    <div class="row">
      <template v-if="namespaced">
        <div ref="nameNsDescriptionWrapper" class="col span-6 name-col">
          <NamespaceNameInput
            data-testid="kw-policy-basic-namespace-input"
            :mode="mode"
            :value="policy"
            name-key="metadata.name"
            namespace-key="metadata.namespace"
            @isNamespaceNew="isNamespaceNew = $event"
          />
        </div>
      </template>

      <template v-else>
        <div class="col span-6 mb-20">
          <LabeledInput
            v-model="policy.metadata.name"
            data-testid="kw-policy-basic-name-input"
            :mode="mode"
            :label="t('nameNsDescription.name.label')"
            :placeholder="t('nameNsDescription.name.placeholder')"
            :required="true"
          />
        </div>
      </template>

      <div class="col span-6">
        <LabeledSelect
          v-model="policy.spec.policyServer"
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
  </div>
</template>
