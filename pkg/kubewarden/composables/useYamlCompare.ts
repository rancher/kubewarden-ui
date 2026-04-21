import { computed, type Ref } from 'vue';

import { VALUES_STATE, YAML_OPTIONS } from '@kubewarden/types';
import { EDITOR_MODES } from '@shell/components/YamlEditor';

type YamlOption = typeof YAML_OPTIONS[number];

export function getCurrentYamlState(
  yamlOption: VALUES_STATE,
  formYaml: string,
  currentYaml: string,
  fallbackFormYaml = ''
): string {
  if (yamlOption === VALUES_STATE.FORM) {
    return formYaml || fallbackFormYaml || '';
  }

  return currentYaml || '';
}

export function hasYamlDiff(
  originalYaml: string,
  yamlOption: VALUES_STATE,
  formYaml: string,
  currentYaml: string,
  fallbackFormYaml = ''
): boolean {
  const originalSnapshotYaml = originalYaml || '';
  const currentComparedYaml = getCurrentYamlState(yamlOption, formYaml, currentYaml, fallbackFormYaml);

  return originalSnapshotYaml !== currentComparedYaml;
}

export function buildFormYamlOptions(options: YamlOption[], canDiff: boolean): YamlOption[] {
  return options.map((option) => {
    if (option.value === VALUES_STATE.DIFF) {
      return {
        ...option,
        disabled: !canDiff
      };
    }

    return option;
  });
}

export function getYamlEditorMode(yamlOption: VALUES_STATE): string {
  return yamlOption === VALUES_STATE.DIFF ? EDITOR_MODES.DIFF_CODE : EDITOR_MODES.EDIT_CODE;
}

export function shouldShowBackToFormModal(
  nextOption: VALUES_STATE,
  currentOption: VALUES_STATE,
  currentYaml: string,
  previousYaml: string,
  hasCancelModal: boolean
): boolean {
  return (
    nextOption === VALUES_STATE.FORM &&
    currentOption !== VALUES_STATE.FORM &&
    currentYaml !== previousYaml &&
    hasCancelModal
  );
}

export function useYamlCompareState(params: {
  yamlOption: Ref<VALUES_STATE>;
  originalYamlValues: Ref<string>;
  formYamlValues: Ref<string>;
  currentYamlValues: Ref<string>;
}) {
  const editorMode = computed(() => {
    return getYamlEditorMode(params.yamlOption.value);
  });

  const canDiff = computed(() => {
    return hasYamlDiff(
      params.originalYamlValues.value,
      params.yamlOption.value,
      params.formYamlValues.value,
      params.currentYamlValues.value
    );
  });

  const formYamlOptions = computed(() => {
    // Keep Compare Changes visible but disabled until there is a real diff.
    return buildFormYamlOptions(YAML_OPTIONS, canDiff.value);
  });

  return {
    editorMode,
    canDiff,
    formYamlOptions,
  };
}
