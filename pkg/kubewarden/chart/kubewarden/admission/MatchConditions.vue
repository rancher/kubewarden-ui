<script>
import { _CREATE, _VIEW } from '@shell/config/query-params';

import CodeMirror from '@shell/components/CodeMirror';
import InfoBox from '@shell/components/InfoBox';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  props: {
    activeTab: {
      type:    String,
      default: null
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
    CodeMirror, InfoBox, LabeledInput
  },

  data() {
    const matchConditions = this.value?.policy?.spec?.matchConditions || [];

    return { matchConditions };
  },

  watch: {
    activeTab() {
      if ( this.activeTab === 'matchConditions' ) {
        this.$nextTick(() => {
          Object.keys(this.$refs).forEach((refKey) => {
            if ( refKey.startsWith('cm-') ) {
              const cmInstance = this.$refs[refKey][0];

              if ( cmInstance && typeof cmInstance.refresh === 'function' ) {
                cmInstance.refresh();
              }
            }
          });
        });
      }
    }
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    codeMirrorOptions() {
      const readOnly = this.isView;

      const gutters = [];

      if ( !readOnly ) {
        gutters.push('CodeMirror-lint-markers');
      }

      gutters.push('CodeMirror-foldgutter');

      return {
        readOnly,
        gutters,
        mode:            'javascript',
        lint:            !readOnly,
        lineNumbers:     !readOnly,
        styleActiveLine: true,
        tabSize:         2,
        indentWithTabs:  false,
        cursorBlinkRate: ( readOnly ? -1 : 530 ),
        extraKeys:       {
          'Ctrl-Space': 'autocomplete',

          Tab: (cm) => {
            if ( cm.somethingSelected() ) {
              cm.indentSelection('add');

              return;
            }

            cm.execCommand('insertSoftTab');
          },

          'Shift-Tab': (cm) => {
            cm.indentSelection('subtract');
          }
        }
      };
    }
  },

  methods: {
    emitUpdate() {
      this.$emit('update:matchConditions', this.matchConditions);
    },

    addCondition() {
      this.matchConditions.push({ name: '', expression: '' });
      this.emitUpdate();
    },

    removeCondition(index) {
      this.matchConditions.splice(index, 1);
      this.emitUpdate();
    },

    handleInput(e, index) {
      this.$set(this.matchConditions[index], 'expression', e);
      this.emitUpdate();
    }
  }
};
</script>

<template>
  <div>
    <p v-clean-html="t('kubewarden.policyConfig.matchConditions.description', {}, true)" class="mb-20" />

    <div v-for="(condition, index) in matchConditions" :key="index" class="mb-20 condition">
      <InfoBox>
        <div class="condition__name-container">
          <LabeledInput
            v-model="condition.name"
            class="mb-10 condition__name"
            :data-testid="`kw-policy-match-condition-name-input-${ index }`"
            :mode="mode"
            :label="t('kubewarden.generic.name')"
            :placeholder="t('kubewarden.policyConfig.matchConditions.name.placeholder')"
            :required="true"
          />

          <button
            v-if="!isView"
            :data-testid="`kw-policy-match-condition-remove-button-${ index }`"
            type="button"
            :disabled="isView"
            class="btn role-link remove btn-sm"
            @click="removeCondition(index)"
          >
            {{ t('kubewarden.policyConfig.matchConditions.remove') }}
          </button>
        </div>

        <h4>{{ t('kubewarden.policyConfig.matchConditions.expression.label') }}</h4>
        <CodeMirror
          :ref="`cm-${ index }`"
          :value="condition.expression"
          :options="codeMirrorOptions"
          :class="{fill: true}"
          :data-testid="`kw-policy-match-condition-expression-${ index }`"
          @onInput="(e) => handleInput(e, index)"
        />
      </InfoBox>
    </div>

    <button
      v-if="!isView"
      data-testid="kw-policy-match-condition-add"
      type="button"
      class="btn role-tertiary add"
      @click="addCondition"
    >
      {{ t('kubewarden.policyConfig.matchConditions.add') }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
::v-deep code {
  padding: 2px;
}

.fill {
  flex: 1;
}

::v-deep .code-mirror  {
  position: relative;

  .CodeMirror {
    background-color: var(--yaml-editor-bg);
    & .CodeMirror-gutters {
      background-color: var(--yaml-editor-bg);
    }
  }
}

.condition {
  &__name-container {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  &__name {
    width: 50%;
  }
}
</style>