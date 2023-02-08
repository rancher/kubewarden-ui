<script>
import { get } from '@shell/utils/object';

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
import SequenceType from './SequenceMap';

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
  } else if ( type.startsWith('sequence[') ) {
    return SequenceType;
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

  data() {
    const seqQuestions = this.question.sequence_questions;

    return { seqQuestions };
  },

  components: { ...knownTypes },

  methods: {
    componentForQuestion,
    get,

    update(variable, index, $event) {
      const out = {
        question: this.question, variable, index, $event
      };

      this.$emit('seqInput', out);
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
        class="row question"
      >
        <div class="col span-12">
          <component
            :is="componentForQuestion(q)"
            in-store="cluster"
            :question="q"
            :value="get(value[vIndex], q.variable)"
            @input="update(q.variable, vIndex, $event)"
          />
        </div>
      </div>

      <button
        type="button"
        :disabled="disabled"
        class="btn role-link remove btn-sm"
        @click="$emit('removeSeq', { question, vIndex })"
      >
        {{ t('generic.remove') }}
      </button>
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
