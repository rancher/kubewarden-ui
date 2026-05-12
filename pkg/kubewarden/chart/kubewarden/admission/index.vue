<script>
import isEmpty from 'lodash/isEmpty';
import jsyaml from 'js-yaml';

import { _CREATE } from '@shell/config/query-params';

import Tab from '@shell/components/Tabbed/Tab';

import { KUBEWARDEN } from '@kubewarden/types';

// Using this custom Questions component until `hide_input` changes are made to @shell version
import Questions from '@kubewarden/components/Questions';

import General from './General';
import Rules from './Rules';
import NamespaceSelector from './NamespaceSelector';
import Settings from './Settings';
import ContextAware from './ContextAware';
import MatchConditions from './MatchConditions';

export default {
  props: {
    customPolicy: {
      type:    Boolean,
      default: false
    },
    errorFetchingPolicy: {
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
    },
    moduleInfo: {
      type:    Object,
      default: null
    },
  },

  components: {
    General,
    Questions,
    Rules,
    NamespaceSelector,
    Settings,
    ContextAware,
    MatchConditions,
    Tab
  },

  inject: ['chartType'],

  data() {
    return {
      activeTab:           null,
      chartValues:         null,
      moduleFieldsMissing: false
    };
  },

  created() {
    if (this.value) {
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

    generalTabError() {
      return !this.chartValues?.policy?.metadata?.name || !this.chartValues?.policy?.spec?.module || this.moduleFieldsMissing;
    },

    rulesTabError() {
      const rules = this.chartValues?.policy?.spec?.rules;

      if (!Array.isArray(rules) || isEmpty(rules)) {
        return true;
      }

      const required = ['apiVersions', 'operations', 'resources'];
      const ruleIsComplete = (rule) => required.every((k) => !isEmpty(rule[k]));
      const hasIncompleteRule = rules.some((rule) => !ruleIsComplete(rule));

      return hasIncompleteRule;
    },

    questionsTabError() {
      const rawQuestions = this.chartValues?.questions?.questions;
      const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
      const settings = this.chartValues?.policy?.spec?.settings || {};
      const required = questions.filter((q) => q.required).map((q) => q.variable);

      if (!required.length) {
        return false;
      }

      const hasEmptyRequired = required.some((requirement) => {
        const settingValue = settings[requirement];
        const isEmptySetting = isEmpty(settingValue) && typeof settingValue !== 'boolean' && typeof settingValue !== 'number';

        return isEmptySetting;
      });

      return hasEmptyRequired;
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
      if (this.isCreate && this.isCustom) {
        return true;
      }

      if (this.hasSettings && !this.hasQuestions) {
        return true;
      }

      if (this.errorFetchingPolicy) {
        return true;
      }

      return false;
    },

    targetNamespace() {
      if (this.value?.metadata?.namespace) {
        return this.value.metadata.namespace;
      }

      return 'default';
    },
  },

  methods: {
    onModuleValidation(missing) {
      this.moduleFieldsMissing = missing;
      this.$emit('module-validation', missing);
    },

    settingsChanged(event) {
      this.chartValues.policy.spec.settings = jsyaml.load(event);
    },

    setActiveTab(tab) {
      this.activeTab = tab;
    },

    updateMatchConditions(matchConditions) {
      if (!this.chartValues.policy.spec) {
        this.chartValues.policy.spec = {};
      }

      this.chartValues.policy.spec.matchConditions = matchConditions;
    }
  }
};
</script>

<template>
  <div>
    <Tab name="general" :label="t('kubewarden.policyConfig.tabs.general')" :weight="99" :error="generalTabError">
      <General
        v-model:value="chartValues"
        data-testid="kw-policy-config-general-tab"
        :mode="mode"
        :target-namespace="targetNamespace"
        :is-custom="isCustom"
        :module-info="moduleInfo"
        @module-validation="onModuleValidation"
      />
    </Tab>

    <template v-if="showSettings">
      <Tab name="settings" :label="t('kubewarden.policyConfig.tabs.settings')" :weight="98" @active="() => setActiveTab('settings')">
        <Settings
          v-model:value="chartValues"
          data-testid="kw-policy-config-settings-tab"
          :active-tab="activeTab"
          @updateSettings="settingsChanged($event)"
        />
      </Tab>
    </template>

    <!-- Values as questions -->
    <template v-if="hasQuestions">
      <Tab name="Settings" :label="t('kubewarden.policyConfig.tabs.settings')" :weight="98" :error="questionsTabError">
        <Questions
          v-model:value="chartValues.policy.spec.settings"
          data-testid="kw-policy-config-questions-tab"
          :mode="mode"
          :source="chartValues"
          tabbed="never"
          :target-namespace="targetNamespace"
        />
      </Tab>
    </template>

    <template v-if="isGlobal">
      <Tab name="namespaceSelector" :label="t('kubewarden.policyConfig.tabs.namespaceSelector')" :weight="97">
        <NamespaceSelector v-model:value="chartValues.policy.spec.namespaceSelector" data-testid="kw-policy-config-ns-selector-tab" :mode="mode" />
      </Tab>
    </template>

    <template v-if="showContextAware">
      <Tab name="contextAware" :label="t('kubewarden.policyConfig.tabs.contextAware')" :weight="96">
        <ContextAware v-model:value="chartValues" data-testid="kw-policy-config-context-tab" :mode="mode" />
      </Tab>
    </template>

    <Tab name="matchConditions" :label="t('kubewarden.policyConfig.tabs.matchConditions')" :weight="95" @active="setActiveTab('matchConditions')">
      <MatchConditions v-model:value="chartValues" :active-tab="activeTab" :mode="mode" @update:matchConditions="updateMatchConditions" />
    </Tab>

    <Tab name="rules" :label="t('kubewarden.policyConfig.tabs.rules')" :weight="94" :error="rulesTabError">
      <Rules v-model:value="chartValues" data-testid="kw-policy-config-rules-tab" :mode="mode" />
    </Tab>
  </div>
</template>
