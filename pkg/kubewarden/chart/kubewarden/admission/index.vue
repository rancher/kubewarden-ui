<script>
import isEmpty from 'lodash/isEmpty';
import jsyaml from 'js-yaml';

import { _CREATE } from '@shell/config/query-params';

import Questions from '@shell/components/Questions';
import Tab from '@shell/components/Tabbed/Tab';
import YamlEditor from '@shell/components/YamlEditor';

import General from './General';
import Rules from './Rules';

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
    General, Questions, Rules, Tab, YamlEditor
  },

  data() {
    let chartValues = null;

    if ( this.value ) {
      chartValues = this.value;
    }

    return { chartValues };
  },

  computed: {
    hasSettings() {
      if ( !this.isCustom ) {
        return !!this.value?.policy?.spec?.settings && !isEmpty(this.value?.policy?.spec?.settings);
      }

      return false;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isCustom() {
      return this.customPolicy;
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

    <template v-if="isCreate && isCustom">
      <Tab name="settings" label="Settings" :weight="97">
        <YamlEditor
          :v-model="value.policy.spec.settings"
          initial-yaml-values="'# Additional Settings YAML \n\n'"
          class="yaml-editor"
          @onInput="settingsChanged($event)"
        />
      </Tab>
    </template>

    <!-- Values as questions -->
    <template v-if="hasSettings">
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
