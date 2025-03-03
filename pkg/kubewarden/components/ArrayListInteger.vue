<script>
import { _CREATE } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import ArrayList from '@shell/components/form/ArrayList';

export default {
  components: {
    ArrayList,
    LabeledInput
  },
  props:      {
    mode: {
      type:    String,
      default: _CREATE
    },
    value: {
      type:     Array,
      default:  () => []
    },
    addLabel: {
      type:    String,
      default: 'Add',
    },
    removeLabel: {
      type:    String,
      default: 'Remove',
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
  data() {
    return { arrayListInteger: this.value };
  },
  methods: {
    handleArrayListUpdate(data) {
      this.arrayListInteger = data;
      this.$emit('update:value', this.arrayListInteger);
    },
    updateRow(index, value) {
      this.arrayListInteger.splice(index, 1, parseInt(value));
      this.$emit('update:value', this.arrayListInteger);
    }
  }
};
</script>

<template>
  <div>
    <ArrayList
      :value="arrayListInteger"
      class="array-list-integer"
      :add-allowed="true"
      :add-label="addLabel"
      :disabled="disabled"
      :default-add-value="0"
      @update:value="handleArrayListUpdate"
    >
      <template v-slot:columns="scope">
        <LabeledInput
          v-model:value.number="scope.row.value"
          data-testid="array-list-integer-input"
          type="number"
          min="0"
          :mode="mode"
          :disabled="disabled"
          :label="inputLabel"
          @update:value="updateRow(scope.i, $event)"
        />
      </template>
    </ArrayList>
  </div>
</template>

<style lang="scss" scoped>
:deep(.unlabeled-select) {
    height: 61px;
}
</style>
