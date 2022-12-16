<script>
import ArrayList from '@shell/components/form/ArrayList';
import Question from './Question';

export default {
  components: { ArrayList },
  mixins:     [Question],
  props:      {
    value: {
      type:    [Array, String],
      default: null
    }
  },

  data() {
    const array = this.value || [];

    return { array };
  },

  methods: {
    update(val) {
      this.$emit('input', val);
    }
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <ArrayList
        :key="question.variable"
        v-model="array"
        :title="question.label"
        :mode="mode"
        :protip="false"
        :disabled="disabled"
        @input="update"
      />
    </div>
    <div
      v-if="showDescription"
      class="col span-6 mt-10"
    >
      {{ question.description }}
    </div>
  </div>
</template>
