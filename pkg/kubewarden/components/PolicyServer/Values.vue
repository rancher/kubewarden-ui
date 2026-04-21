<script>
import { defineAsyncComponent, markRaw } from 'vue';
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
import YamlEditor from '@shell/components/YamlEditor';
import YamlFullDiff from '@kubewarden/components/YamlFullDiff.vue';

import { VALUES_STATE, YAML_OPTIONS } from '@kubewarden/types';
import {
  buildFormYamlOptions,
  getCurrentYamlState,
  getYamlEditorMode,
  hasYamlDiff,
  shouldShowBackToFormModal
} from '@kubewarden/composables/useYamlCompare';

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
    ButtonGroup,
    Loading,
    ResourceCancelModal,
    Tabbed,
    YamlEditor,
    YamlFullDiff
  },

  async created() {
    const valuesYaml = this.generateYaml();

    this.formYamlValues = valuesYaml;
    this.currentYamlValues = valuesYaml;
    this.originalYamlValues = valuesYaml;
    this.previousYamlValues = valuesYaml;

    try {
      await this.loadValuesComponent();
    } catch (e) {
      console.error(`Error loading values component: ${ e }`);
    }
  },

  data() {
    return {
      VALUES_STATE,
      YAML_OPTIONS,
      currentYamlValues:   '',
      originalYamlValues:  '',
      previousYamlValues:  '',
      formYamlValues:      '',
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
    chartValues: {
      deep: true,
      handler() {
        this.formYamlValues = this.generateYaml();
      }
    },

    preYamlOption(neu) {
      const showBackToFormModal = shouldShowBackToFormModal(
        neu,
        this.yamlOption,
        this.currentYamlValues,
        this.previousYamlValues,
        !!this.$refs.cancelModal
      );

      if (showBackToFormModal) {
        this.$refs.cancelModal.show();
      } else {
        this.yamlOption = neu;
      }
    },

    yamlOption(neu, old) {
      switch (neu) {
      case VALUES_STATE.FORM:
        // Returning to form discards YAML edits and restores the last form snapshot.
        this.currentYamlValues = this.previousYamlValues;
        this.preYamlOption = VALUES_STATE.FORM;

        this.showForm = true;
        break;

      case VALUES_STATE.YAML:
      case VALUES_STATE.DIFF:
        if (old === VALUES_STATE.FORM || !old) {
          this.currentYamlValues = getCurrentYamlState(
            VALUES_STATE.FORM,
            this.formYamlValues,
            this.currentYamlValues,
            this.buildYamlFromForm()
          );
          this.previousYamlValues = this.currentYamlValues;
        }

        if (neu === VALUES_STATE.DIFF) {
          this.updateYamlValues();
        }

        this.showForm = false;
        break;
      }
    },
  },

  computed: {
    formYamlOptions() {
      return buildFormYamlOptions(this.YAML_OPTIONS, this.canDiff);
    },

    editorMode() {
      return getYamlEditorMode(this.yamlOption);
    },

    canDiff() {
      return hasYamlDiff(
        this.originalYamlValues,
        this.yamlOption,
        this.formYamlValues,
        this.currentYamlValues,
        this.buildYamlFromForm()
      );
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
      const filteredLines = lines.filter((line) => !line.includes('Error loading schema for array'));
      const modifiedYAML = filteredLines.join('\n');

      return modifiedYAML;
    },

    buildYamlFromForm() {
      return this.generateYaml();
    },

    async loadValuesComponent() {
      if (this.value.haveComponent('kubewarden/policy-server')) {
        const importFn = this.value.importComponent('kubewarden/policy-server');

        this.valuesComponent = markRaw(defineAsyncComponent(importFn));

        this.showValuesComponent = true;
      }
    },

    tabChanged() {
      window.scrollTop = 0;
    },

    updateYamlValues() {
      if (!isEmpty(this.currentYamlValues)) {
        const parsed = jsyaml.load(this.currentYamlValues);

        if (parsed) {
          merge(this.chartValues, parsed);
        }
      }
    },

    handleValidationPassed(val) {
      this.$emit('validation-passed', val);
    },

    confirmBackToForm() {
      // User confirmed "Back to Form" from YAML/Compare.
      this.preYamlOption = VALUES_STATE.FORM;
      this.yamlOption = VALUES_STATE.FORM;
    },

    cancelBackToForm() {
      // User chose to stay in YAML/Compare.
      this.preYamlOption = this.yamlOption;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else class="scroll__container">
    <div v-if="isCreate || isEdit" class="step__values__controls">
      <ButtonGroup
        v-model:value="preYamlOption"
        data-testid="kw-policy-server-config-yaml-option"
        :options="formYamlOptions"
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
            v-model:value="values"
            :resource="value"
            :mode="mode"
            @validation-passed="handleValidationPassed"
          />
        </Tabbed>
      </template>
      <template v-else-if="(isCreate || isEdit) && !showForm">
        <YamlFullDiff
          v-if="yamlOption === VALUES_STATE.DIFF"
          data-testid="kw-policy-server-config-yaml-diff"
          class="step__values__content"
          :orig="originalYamlValues"
          :neu="currentYamlValues"
        />
        <YamlEditor
          v-else
          ref="yaml"
          v-model:value="currentYamlValues"
          data-testid="kw-policy-server-config-yaml-editor"
          class="step__values__content"
          :scrolling="true"
          :initial-yaml-values="originalYamlValues"
          :editor-mode="editorMode"
          :hide-preview-buttons="false"
          @onChanges="updateYamlValues"
        />
      </template>

      <ResourceCancelModal
        ref="cancelModal"
        data-testid="kw-policy-server-config-yaml-cancel"
        :is-cancel-modal="false"
        :is-form="true"
        @cancel-cancel="cancelBackToForm"
        @confirm-cancel="confirmBackToForm"
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

  :deep(.step-container) {
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

        :deep(.tab-container) {
          overflow: auto;
        }
      }
    }
  }
</style>
