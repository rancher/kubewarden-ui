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
      this.$emit('update:value', val);
    }
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <ArrayList
        :key="question.variable"
        v-model:value="array"
        :title="question.label"
        :value-multiline="question.value_multiline"
        :mode="mode"
        :protip="false"
        :disabled="disabled"
        @update:value="update"
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
