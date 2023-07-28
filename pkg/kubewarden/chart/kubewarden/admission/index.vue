<script>
import isEmpty from 'lodash/isEmpty';
import jsyaml from 'js-yaml';

import { _CREATE } from '@shell/config/query-params';

import Tab from '@shell/components/Tabbed/Tab';

import { KUBEWARDEN } from '../../../types';

// Using this custom Questions component until `hide_input` changes are made to @shell version
import Questions from '../../../components/Questions';

import General from './General';
import Rules from './Rules';
import NamespaceSelector from './NamespaceSelector';
import Settings from './Settings';
import ContextAware from './ContextAware';

export default {
  props: {
    customPolicy: {
      type:    Boolean,
      default: false
    },
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
    General, Questions, Rules, NamespaceSelector, Settings, ContextAware, Tab
  },

  inject: ['chartType'],

  data() {
    return { chartValues: null };
  },

  created() {
    if ( this.value ) {
      this.chartValues = this.value;
    }
  },

  computed: {
    hasContextAware() {
      return !isEmpty(this.value?.policy?.spec?.contextAwareResources);
    },

    hasSettings() {
      return !isEmpty(this.value?.policy?.spec?.settings);
    },

    hasQuestions() {
      return !isEmpty(this.chartValues?.questions?.questions);
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isCustom() {
      return this.customPolicy;
    },

    isGlobal() {
      return this.chartType === KUBEWARDEN.CLUSTER_ADMISSION_POLICY;
    },

    showContextAware() {
      return this.hasContextAware || this.isCustom;
    },

    showSettings() {
      if ( this.isCreate && this.isCustom ) {
        return true;
      }

      if ( this.hasSettings && !this.hasQuestions ) {
        return true;
      }

      return false;
    },

    targetNamespace() {
      if ( this.forceNamespace ) {
        return this.forceNamespace;
      } else if ( this.value?.metadata?.namespace ) {
        return this.value.metadata.namespace;
      }

      return 'default';
    },
  },

  methods: {
    settingsChanged(event) {
      this.chartValues.policy.spec.settings = jsyaml.load(event);
    }
  }
};
</script>

<template>
  <div>
    <Tab name="general" :label="t('kubewarden.policyConfig.tabs.general')" :weight="99">
      <General v-model="chartValues" data-testid="kw-policy-config-general-tab" :mode="mode" :target-namespace="targetNamespace" />
    </Tab>
    <Tab name="rules" :label="t('kubewarden.policyConfig.tabs.rules')" :weight="98">
      <Rules v-model="chartValues" data-testid="kw-policy-config-rules-tab" :mode="mode" />
    </Tab>

    <template v-if="isGlobal">
      <Tab name="namespaceSelector" :label="t('kubewarden.policyConfig.tabs.namespaceSelector')" :weight="97">
        <NamespaceSelector v-model="chartValues.policy.spec.namespaceSelector" data-testid="kw-policy-config-ns-selector-tab" :mode="mode" />
      </Tab>
    </template>

    <template v-if="showContextAware">
      <Tab name="contextAware" :label="t('kubewarden.policyConfig.tabs.contextAware')" :weight="97">
        <ContextAware v-model="chartValues" data-testid="kw-policy-config-context-tab" :mode="mode" />
      </Tab>
    </template>

    <template v-if="showSettings">
      <Tab name="settings" :label="t('kubewarden.policyConfig.tabs.settings')" :weight="95">
        <Settings
          v-model="chartValues"
          data-testid="kw-policy-config-settings-tab"
          @updateSettings="settingsChanged($event)"
        />
      </Tab>
    </template>

    <!-- Values as questions -->
    <template v-if="hasQuestions">
      <Tab name="Settings" label="Settings" :weight="95">
        <Questions
          v-model="chartValues.policy.spec.settings"
          data-testid="kw-policy-config-questions-tab"
          :mode="mode"
          :source="chartValues"
          tabbed="never"
          :target-namespace="targetNamespace"
        />
      </Tab>
    </template>
  </div>
</template>
