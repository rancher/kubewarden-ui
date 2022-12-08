<script>
import isEmpty from 'lodash/isEmpty';
import jsyaml from 'js-yaml';

import { _CREATE, _VIEW } from '@shell/config/query-params';
import { saferDump } from '@shell/utils/create-yaml';

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

  fetch() {
    if ( this.value ) {
      this.chartValues = this.value;
    }

    if ( !isEmpty(this.chartValues?.policy?.spec?.settings) ) {
      this.settingsYaml = saferDump(this.chartValues.policy.spec.settings);
    }

    if ( this.isCreate && this.isCustom ) {
      this.settingsYaml = '# Additional Settings YAML \n';
    }
  },

  data() {
    return {
      chartValues:  null,
      settingsYaml: ''
    };
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

    isView() {
      return this.mode === _VIEW;
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
        <YamlEditor
          ref="yamleditor"
          v-model="settingsYaml"
          class="yaml-editor"
          :editor-mode="isView ? 'VIEW_CODE' : 'EDIT_CODE'"
          @onInput="settingsChanged($event)"
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

<style lang="scss" scoped>
::v-deep .CodeMirror-lines {
    min-height: 40px;
  }
</style>
