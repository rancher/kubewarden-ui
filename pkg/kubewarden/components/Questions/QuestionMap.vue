<script>
import KeyValue from '@shell/components/form/KeyValue';
import Question from './Question';

export default {
  name: 'QuestionMap',

  props: {
    value: {
      type:    [Array, Object],
      default: () => {}
    }
  },

  components: { KeyValue },

  mixins: [Question],

  data() {
    const questionValue = this.value?.[this.question.variable] || this.value;

    return { questionValue };
  },

  methods: {
    update(val) {
      this.$emit('input', val);
    }
  }
};
</script>

<template>
  <div>
    <div
      v-if="showDescription"
      class="row mt-10"
    >
      <div class="col span-12">
        {{ question.description }}
      </div>
    </div>
    <div class="row">
      <div class="col span-12 mt-10">
        <KeyValue
          v-if="showInput"
          :key="question.variable"
          v-model="questionValue"
          :title="question.label"
          :mode="mode"
          :protip="false"
          :disabled="disabled"
          @input="update"
        />
        <h3 v-else>
          {{ question.label }}
        </h3>
      </div>
    </div>
  </div>
</template>
