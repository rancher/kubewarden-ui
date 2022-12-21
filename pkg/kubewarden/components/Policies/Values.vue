<script>
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';
import { createYaml, saferDump } from '@shell/utils/create-yaml';
import { clone, set } from '@shell/utils/object';

import ButtonGroup from '@shell/components/ButtonGroup';
import ResourceCancelModal from '@shell/components/ResourceCancelModal';
import Tabbed from '@shell/components/Tabbed';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';

import { VALUES_STATE, YAML_OPTIONS } from '../../types';

export default {
  name: 'Values',

  props: {
    mode: {
      type:     String,
      default:  _VIEW
    },
    chartValues: {
      type:     Object,
      required: true
    },
    customPolicy: {
      type:    Boolean,
      default: false
    },
    value: {
      type:     Object,
      required: true
    },
    yamlValues: {
      type:    String,
      default: ''
    }
  },

  components: {
    ButtonGroup, ResourceCancelModal, Tabbed, YamlEditor
  },

  async fetch() {
    if ( !this.chartValues.questions && this.chartValues?.policy?.spec?.settings ) {
      try {
        const questions = await this.value.policyQuestions();

        set(this.chartValues, 'questions', questions);
      } catch (e) {
        console.warn(`Unable to fetch chart questions: ${ e }`); // eslint-disable-line no-console
      }
    }

    try {
      this.version = this.$store.getters['catalog/version']({
        repoType:      'cluster',
        repoName:      'kubewarden',
        chartName:     'kubewarden-controller',
      });

      await this.loadValuesComponent();
    } catch (e) {
      console.warn(`Unable to fetch Version: ${ e }`); // eslint-disable-line no-console
    }

    this.generateYaml();
  },

  data() {
    return {
      YAML_OPTIONS,
      currentYamlValues:   '',
      originalYamlValues:  '',
      showQuestions:       true,
      valuesComponent:     null,
      preYamlOption:       VALUES_STATE.FORM,
      yamlOption:          VALUES_STATE.FORM
    };
  },

  watch: {
    yamlOption(neu, old) {
      switch (neu) {
      case VALUES_STATE.FORM:
        this.showQuestions = true;
        this.$emit('editor', neu);

        break;
      case VALUES_STATE.YAML:
        if ( old === VALUES_STATE.FORM ) {
          this.currentYamlValues = saferDump(this.chartValues.policy);
        }

        this.showQuestions = false;
        this.$emit('editor', neu);

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
    }
  },

  methods: {
    generateYaml() {
      const inStore = this.$store.getters['currentStore'](this.value);
      const schemas = this.$store.getters[`${ inStore }/all`](SCHEMA);
      const cloned = this.chartValues?.policy ? clone(this.chartValues.policy) : this.value;

      if ( this.yamlValues?.length ) {
        this.currentYamlValues = this.yamlValues;
      } else {
        this.currentYamlValues = createYaml(schemas, this.value?.type, cloned);
      }
    },

    async loadValuesComponent() {
      if ( this.value?.haveComponent('kubewarden/admission') ) {
        this.valuesComponent = this.value?.importComponent('kubewarden/admission');

        await this.valuesComponent();
      }
    },

    tabChanged() {
      window.scrollTop = 0;
    },
  }
};
</script>

<template>
  <div>
    <div v-if="isCreate" class="step__values__controls">
      <ButtonGroup
        v-model="yamlOption"
        :options="YAML_OPTIONS"
        inactive-class="bg-disabled btn-sm"
        active-class="bg-primary btn-sm"
      />
    </div>
    <div class="scroll__container">
      <div class="scroll__content">
        <template v-if="showQuestions">
          <Tabbed
            ref="tabs"
            :side-tabs="true"
            class="step__values__content"
            @changed="tabChanged($event)"
          >
            <template v-if="valuesComponent">
              <component
                :is="valuesComponent"
                v-model="chartValues"
                :mode="mode"
                :custom-policy="customPolicy"
              />
            </template>
          </Tabbed>
        </template>
        <template v-else-if="isCreate && !showQuestions">
          <YamlEditor
            ref="yaml"
            v-model="currentYamlValues"
            class="step__values__content"
            :scrolling="true"
            :initial-yaml-values="originalYamlValues"
            :editor-mode="editorMode"
            :hide-preview-buttons="true"
          />
        </template>

        <ResourceCancelModal
          ref="cancelModal"
          :is-cancel-modal="false"
          :is-form="true"
          @cancel-cancel="preYamlOption = yamlOption"
          @confirm-cancel="yamlOption = preYamlOption"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $padding: 5px;

  .step {
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
