<script>
import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';
import jsyaml from 'js-yaml';

import { _CREATE, _EDIT } from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';
import { createYaml } from '@shell/utils/create-yaml';

import ButtonGroup from '@shell/components/ButtonGroup';
import Loading from '@shell/components/Loading';
import ResourceCancelModal from '@shell/components/ResourceCancelModal';
import Tabbed from '@shell/components/Tabbed';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';

import { VALUES_STATE, YAML_OPTIONS } from '../../types';

export default {
  name: 'Values',

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    chartValues: {
      type:     Object,
      default:  () => {}
    },

    value: {
      type:     Object,
      required: true
    }
  },

  components: {
    ButtonGroup, Loading, ResourceCancelModal, Tabbed, YamlEditor
  },

  async fetch() {
    const valuesYaml = this.generateYaml();

    this.currentYamlValues = valuesYaml;
    this.originalYamlValues = valuesYaml;

    try {
      await this.loadValuesComponent();
    } catch (e) {
      console.error(`Error loading values component: ${ e }`); // eslint-disable-line no-console
    }
  },

  data() {
    return {
      YAML_OPTIONS,
      currentYamlValues:   '',
      originalYamlValues:  '',
      showForm:            true,
      configValues:        null,
      showQuestions:       true,
      showValuesComponent: false,
      valuesComponent:     null,
      preYamlOption:       VALUES_STATE.FORM,
      yamlOption:          VALUES_STATE.FORM,
      values:              this.chartValues
    };
  },

  watch: {
    yamlOption(neu, old) {
      switch (neu) {
      case VALUES_STATE.FORM:
        this.showForm = true;
        break;
      case VALUES_STATE.YAML:
        if ( old === VALUES_STATE.FORM ) {
          this.currentYamlValues = this.generateYaml();
          this.updateYamlValues();
        }

        this.showForm = false;
        break;
      }
    },
  },

  computed: {
    editorMode() {
      return EDITOR_MODES.EDIT_CODE;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isEdit() {
      return this.mode === _EDIT;
    }
  },

  methods: {
    generateYaml() {
      const schemas = this.$store.getters['cluster/all'](SCHEMA);
      const yaml = createYaml(schemas, this.value?.type, this.chartValues);

      const lines = yaml.split('\n');
      const filteredLines = lines.filter(line => !line.includes('Error loading schema for array'));
      const modifiedYAML = filteredLines.join('\n');

      return modifiedYAML;
    },

    async loadValuesComponent() {
      if ( this.value.haveComponent('kubewarden/policy-server') ) {
        this.valuesComponent = this.value.importComponent('kubewarden/policy-server');
        await this.valuesComponent();

        this.showValuesComponent = true;
      }
    },

    tabChanged() {
      window.scrollTop = 0;
    },

    updateYamlValues() {
      if ( !isEmpty(this.currentYamlValues) ) {
        const parsed = jsyaml.load(this.currentYamlValues);

        if ( parsed ) {
          merge(this.chartValues, parsed);
        }
      }
    },

    handleValidationPassed(val) {
      this.$emit('validation-passed', val);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else class="scroll__container">
    <div v-if="isCreate || isEdit" class="step__values__controls">
      <ButtonGroup
        v-model="yamlOption"
        data-testid="kw-policy-server-config-yaml-option"
        :options="YAML_OPTIONS"
        inactive-class="bg-disabled btn-sm"
        active-class="bg-primary btn-sm"
      />
    </div>
    <div class="scroll__content">
      <template v-if="showForm">
        <Tabbed
          ref="tabs"
          :side-tabs="true"
          class="step__values__content"
          @changed="tabChanged($event)"
        >
          <component
            :is="valuesComponent"
            v-model="values"
            :resource="value"
            :mode="mode"
            @validation-passed="handleValidationPassed"
          />
        </Tabbed>
      </template>
      <template v-else-if="(isCreate || isEdit) && !showForm">
        <YamlEditor
          ref="yaml"
          v-model="currentYamlValues"
          data-testid="kw-policy-server-config-yaml-editor"
          class="step__values__content"
          :scrolling="true"
          :initial-yaml-values="originalYamlValues"
          :editor-mode="editorMode"
          :hide-preview-buttons="true"
          @onChanges="updateYamlValues"
        />
      </template>

      <ResourceCancelModal
        ref="cancelModal"
        data-testid="kw-policy-server-config-yaml-cancel"
        :is-cancel-modal="false"
        :is-form="true"
        @cancel-cancel="preYamlOption = yamlOption"
        @confirm-cancel="yamlOption = preYamlOption"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $padding: 5px;
  $height: 110px;
  $side: 15px;
  $margin: 10px;
  $logo: 60px;

  ::v-deep .step-container {
    height: auto;
  }

  .step {
    &__basic {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow-x: hidden;

      .spacer {
        line-height: 2;
      }
    }

    &__values {
      &__controls {
        display: flex;
        margin-bottom: 15px;

        & > *:not(:last-of-type) {
          margin-right: $padding * 2;
        }

        &--spacer {
          flex: 1
        }

      }

      &__content {
        flex: 1;

        ::v-deep .tab-container {
          overflow: auto;
        }
      }
    }
  }
</style>
