<script>
import { _CREATE } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import ArrayList from '@shell/components/form/ArrayList';

export default {
  components: { ArrayList, LabeledInput },
  props:      {
    mode: {
      type:    String,
      default: _CREATE
    },
    value: {
      type:     Array,
      required: true
    },
    addLabel: {
      type: String,
      default() {
        return this.$store.getters['i18n/t']('generic.add');
      },
    },
    removeLabel: {
      type: String,
      default() {
        return this.$store.getters['i18n/t']('generic.remove');
      },
    },
    inputLabel: {
      type:    String,
      default: ''
    },
    loading: {
      type:    Boolean,
      default: false
    },
    disabled: {
      type:    Boolean,
      default: true
    }
  },

  methods: {
    updateRow(index, value) {
      this.value.splice(index, 1, parseInt(value));
      this.$emit('input', this.value);
    }
  }
};
</script>

<template>
  <div>
    <ArrayList
      :value="value"
      class="array-list-integer"
      :add-allowed="true"
      :add-label="addLabel"
      :disabled="disabled"
      :default-add-value="0"
      @input="$emit('input', $event)"
    >
      <template v-slot:columns="scope">
        <LabeledInput
          v-model.number="scope.row.value"
          type="number"
          min="0"
          :mode="mode"
          :disabled="disabled"
          :label="inputLabel"
          @input="updateRow(scope.i, $event)"
        />
      </template>
    </ArrayList>
  </div>
</template>

<style lang="scss" scoped>
::v-deep .unlabeled-select {
    height: 61px;
}
</style>
