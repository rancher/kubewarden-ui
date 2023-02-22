<script>
import { _VIEW } from '@shell/config/query-params';
import { get } from '@shell/utils/object';
import { saferDump } from '@shell/utils/create-yaml';

import YamlEditor from '@shell/components/YamlEditor';
import BooleanType from '@shell/components/Questions/Boolean';
import EnumType from '@shell/components/Questions/Enum';
import IntType from '@shell/components/Questions/Int';
import FloatType from '@shell/components/Questions/Float';
import ReferenceType from '@shell/components/Questions/Reference';
import CloudCredentialType from '@shell/components/Questions/CloudCredential';

/*
  Replacing these components until we are able to hide inputs with `hide_input` property in questions
*/
import ArrayType from './Array';
import MapType from './QuestionMap';
import StringType from './String';

const knownTypes = {
  string:          StringType,
  hostname:        StringType, // @TODO
  multiline:       StringType,
  password:        StringType,
  boolean:         BooleanType,
  enum:            EnumType,
  int:             IntType,
  float:           FloatType,
  questionMap:     MapType,
  reference:       ReferenceType,
  configmap:       ReferenceType,
  secret:          ReferenceType,
  storageclass:    ReferenceType,
  pvc:             ReferenceType,
  cloudcredential: CloudCredentialType,
};

function componentForQuestion(q) {
  const type = (q.type || '').toLowerCase();

  if ( knownTypes[type] ) {
    return type;
  } else if ( type.startsWith('array[') ) { // This only really works for array[string|multiline], but close enough for now.
    return ArrayType;
  } else if ( type.startsWith('map[') ) { // Same, only works with map[string|multiline]
    return MapType;
  } else if ( type.startsWith('reference[') ) { // Same, only works with map[string|multiline]
    return ReferenceType;
  }

  return 'string';
}

export default {
  props: {
    disabled: {
      type:    Boolean,
      default: false
    },
    question: {
      type:     Object,
      required: true
    },
    value: {
      type:    Array,
      default: () => []
    }
  },

  components: { ...knownTypes, YamlEditor },

  data() {
    const seqQuestions = this.question.sequence_questions;

    return { seqQuestions, sequenceValuesYaml: '' };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    componentForQuestion,
    get,

    update(variable, index, $event) {
      const out = {
        question: this.question, variable, index, event: $event
      };

      this.$emit('seqInput', out);
    },

    updateDeep(q, vIndex, $event) {
      const out = {
        rootQuestion: this.question.variable,
        deepQuestion: q.variable,
        valuesYaml:   $event,
        index:        vIndex
      };

      this.$emit('seqInputDeep', out);
    },

    updateDeepSubquestion(rootValue, seq, sub, vIndex, $event) {
      /*
        When a `sequence` contains a set of subquestions, the
        subquestion.variable string needs to be split to update
        the correct variable on the rootValue.
      */
      const path = sub.variable.split('.');
      let toUpdate = null;

      for ( let i = 0; i < path.length; i++ ) {
        if ( rootValue[path[i]] !== seq ) {
          toUpdate = path[i];
        }
      }

      const out = {
        question:    this.question,
        variable:    seq.variable,
        subVariable: toUpdate,
        index:       vIndex,
        event:       $event
      };

      this.$emit('seqInput', out);
    },

    parseSequenceValues(val, question) {
      if ( val && val.length ) {
        return saferDump(val);
      }

      const out = {};

      question.sequence_questions.forEach((q) => {
        Object.assign(out, { [q.variable]: q.default });
      });

      return saferDump({ [question.variable]: [out] });
    },

    parseSequenceSubquestion(rootValue, subquestion) {
      /*
        The subquestion.variable is a string which contains a dot notation
        string of the actual variable. Need to separate and create an
        object on the rootValue from this string.
      */
      const path = subquestion.variable.split('.');
      let currObj = rootValue;

      for ( let i = 0; i < path.length; i++ ) {
        if ( currObj[path[i]] === undefined ) {
          currObj[path[i]] = subquestion.default;
        }

        currObj = currObj[path[i]];
      }

      return currObj;
    }
  }
};
</script>

<template>
  <div>
    <h3>
      {{ question.label }}
    </h3>
    <div v-for="(val, vIndex) in value" :key="val + vIndex" class="seq__container mb-20">
      <div
        v-for="(q, index) in seqQuestions"
        :key="index"
      >
        <template v-if="q.type.startsWith('sequence[')">
          <div class="row question">
            <div class="col span-12 mb-10">
              <h4>{{ q.label }}</h4>
              <YamlEditor
                ref="yamleditor"
                :value="parseSequenceValues(val[q.variable], q)"
                class="yaml-editor"
                :editor-mode="isView ? 'VIEW_CODE' : 'EDIT_CODE'"
                @onInput="updateDeep(q, vIndex, $event)"
              />
            </div>
          </div>
        </template>

        <template v-if="q.type.startsWith('map[') && q.subquestions">
          <div
            v-for="(sub, subIndex) in q.subquestions"
            :key="sub.variable + subIndex"
            class="row question"
          >
            <div class="col span-12 mb-10">
              <component
                :is="componentForQuestion(sub)"
                in-store="cluster"
                :question="sub"
                :value="parseSequenceSubquestion(value[vIndex], sub)"
                @input="updateDeepSubquestion(value[vIndex], q, sub, vIndex, $event)"
              />
            </div>
          </div>
        </template>

        <template v-else>
          <div class="row question">
            <div class="col span-12 mb-10">
              <component
                :is="componentForQuestion(q)"
                in-store="cluster"
                :question="q"
                :value="get(value[vIndex], q.variable)"
                @input="update(q.variable, vIndex, $event)"
              />
            </div>
          </div>
        </template>
      </div>

      <button
        type="button"
        :disabled="disabled"
        class="btn role-link remove btn-sm"
        @click="$emit('removeSeq', { question, vIndex })"
      >
        {{ t('generic.remove') }}
      </button>

      <hr class="mb-20">
    </div>

    <button
      type="button"
      class="btn role-tertiary add"
      :disabled="disabled"
      @click="$emit('addSeq', question)"
    >
      {{ t('generic.add') }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.seq {
  &__container {
    position: relative;
    display: block;

    & > .remove {
      position: absolute;

      padding: 0px;

      top: 0;
      right: 0;
    }
  }
}
</style>
