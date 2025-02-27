<script>
import { _CREATE } from '@shell/config/query-params';
import ArrayList from '@shell/components/form/ArrayList';
import { LabeledInput } from '@components/Form/LabeledInput';

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
    configType: {
      type:    String,
      default: 'pod'
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
      type:     Object,
      default:  () => {},
      required: true
    },
    inputPlaceholderLabel: {
      type:     Object,
      default:  () => {},
      required: true
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
    handleAddRow() {
      this.value.push({
        name:  '',
        value: '',
      });
      this.$emit('update:value', this.value);
    },
    handleRemoveRow(data) {
      this.value.splice(data.index, 1);
      this.$emit('update:value', this.value);
    },
    updateRow(index, key, value) {
      const currValue = Object.assign({}, this.value[index]);

      currValue[key] = value;

      this.value.splice(index, 1, currValue);
      this.$emit('update:value', this.value);
    }
  }
};
</script>

<template>
  <div>
    <ArrayList
      :value="value"
      class="sysctls-array-list"
      :add-allowed="true"
      :add-label="addLabel"
      :disabled="disabled"
      :default-add-value="{ name: '', value: '' }"
      @add="handleAddRow"
      @remove="handleRemoveRow"
    >
      <template v-slot:columns="scope">
        <LabeledInput
          v-model:value="scope.row.value.name"
          :data-testid="`ps-config-security-context-${configType}-sysctls-name-input`"
          :mode="mode"
          :disabled="disabled"
          :label="inputLabel.name"
          :placeholder="inputPlaceholderLabel.name"
          required
          @update:value="updateRow(scope.i, 'name', $event)"
        />
        <LabeledInput
          v-model:value="scope.row.value.value"
          :data-testid="`ps-config-security-context-${configType}-sysctls-value-input`"
          :mode="mode"
          :disabled="disabled"
          :label="inputLabel.value"
          :placeholder="inputPlaceholderLabel.value"
          required
          @update:value="updateRow(scope.i, 'value', $event)"
        />
      </template>
    </ArrayList>
  </div>
</template>

<style lang="scss" scoped>
:deep(.box) {
  grid-template-columns: auto auto 75px;
  grid-gap: 10px;
}

:deep(.unlabeled-select) {
  height: 61px;
}
</style>
