<script>
import isEmpty from 'lodash/isEmpty';
import jsyaml from 'js-yaml';

import { _CREATE } from '@shell/config/query-params';

import Tab from '@shell/components/Tabbed/Tab';

// Using this custom Questions component until `hide_input` changes are made to @shell version
import Questions from '../../../components/Questions';
import General from './General';
import Rules from './Rules';
import Settings from './Settings.vue';

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
    General, Questions, Rules, Settings, Tab
  },

  data() {
    return { chartValues: null };
  },

  created() {
    if ( this.value ) {
      this.chartValues = this.value;
    }
  },

  computed: {
    hasSettings() {
      return !isEmpty(this.value?.policy?.spec?.settings);
    },

    hasQuestions() {
      if ( !isEmpty(this.chartValues?.questions?.questions) ) {
        return true;
      }

      return false;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isCustom() {
      return this.customPolicy;
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
    <Tab name="general" label="General" :weight="99">
      <General v-model="chartValues" :mode="mode" :target-namespace="targetNamespace" />
    </Tab>
    <Tab name="rules" label="Rules" :weight="98">
      <Rules v-model="chartValues" :mode="mode" />
    </Tab>

    <template v-if="showSettings">
      <Tab name="settings" label="Settings" :weight="97">
        <Settings
          v-model="chartValues"
          @updateSettings="settingsChanged($event)"
        />
      </Tab>
    </template>

    <!-- Values as questions -->
    <template v-if="hasQuestions">
      <Tab name="Settings" label="Settings" :weight="97">
        <Questions
          v-model="chartValues.policy.spec.settings"
          :mode="mode"
          :source="chartValues"
          tabbed="never"
          :target-namespace="targetNamespace"
        />
      </Tab>
    </template>
  </div>
</template>
