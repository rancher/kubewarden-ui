<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import Question from './Question';

//  @TODO valid_chars, invalid_chars

export default {
  components: { LabeledInput },
  mixins:     [Question],

  computed: {
    inputType() {
      if ( ['text', 'password', 'multiline'].includes(this.question.type) ) {
        return this.question.type;
      }

      return 'text';
    }
  }
};
</script>

<template>
  <div class="row">
    <div v-if="showInput" class="col span-6">
      <LabeledInput
        :mode="mode"
        :type="inputType"
        :label="displayLabel"
        :placeholder="question.default"
        :required="question.required"
        :value="value"
        :disabled="disabled"
        @input="$emit('input', $event)"
      />
    </div>
    <div
      v-if="showDescription"
      class="col mt-10 mb-10"
      :class="{ 'span-6': showInput, 'span-12': !showInput }"
    >
      {{ displayDescription }}
    </div>
  </div>
</template>
