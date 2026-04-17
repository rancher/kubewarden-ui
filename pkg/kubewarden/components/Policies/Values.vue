<script setup lang="ts">
import {
  ref,
  onMounted,
  watch,
  computed,
  markRaw
} from 'vue';
import { useStore } from 'vuex';
import { defineAsyncComponent, toRaw } from 'vue';

import { _CREATE, _EDIT } from '@shell/config/query-params';
import { saferDump } from '@shell/utils/create-yaml';

import ButtonGroup from '@shell/components/ButtonGroup';
import Loading from '@shell/components/Loading';
import ResourceCancelModal from '@shell/components/ResourceCancelModal';
import Tabbed from '@shell/components/Tabbed';
import YamlEditor from '@shell/components/YamlEditor';

import {
  KUBEWARDEN_CHARTS,
  VALUES_STATE,
  RANCHER_NS_MATCH_EXPRESSION
} from '@kubewarden/types';
import { PolicyModuleInfo } from '@kubewarden/modules/policyChart';
import { shouldShowBackToFormModal, useYamlCompareState } from '@kubewarden/composables/useYamlCompare';

interface Props {
  mode: string;
  chartValues: Record<string, any>;
  customPolicy?: boolean;
  value: Record<string, any>;
  yamlValues: string;
  errorFetchingPolicy: boolean;
  moduleInfo?: PolicyModuleInfo | null;
}

const props = defineProps<Props>();
const store = useStore();
const emit = defineEmits(['editor', 'updateYamlValues', 'module-validation']);

const fetchPending = ref(true);

const currentYamlValues = ref('');
const originalYamlValues = ref('');
const formYamlValues = ref('');
const showForm = ref(true);
const valuesComponent = ref<any>(null);
const preYamlOption = ref(VALUES_STATE.FORM);
const yamlOption = ref(VALUES_STATE.FORM);
const previousYamlValues = ref('');
const version = ref<any>(null);
const cancelModal = ref<any>(null);

const isCreate = computed(() => props.mode === _CREATE);
const isEdit = computed(() => props.mode === _EDIT);
const { editorMode, canDiff, formYamlOptions } = useYamlCompareState({
  yamlOption,
  originalYamlValues,
  formYamlValues,
  currentYamlValues,
});

watch(preYamlOption, (neu) => {
  const showBackToFormModal = shouldShowBackToFormModal(
    neu,
    yamlOption.value,
    currentYamlValues.value,
    previousYamlValues.value,
    !!cancelModal.value
  );

  if (showBackToFormModal) {
    cancelModal.value.show();
  } else {
    yamlOption.value = neu;
  }
});

watch(() => props.chartValues?.policy, () => {
  formYamlValues.value = buildYamlFromForm();
}, {
  deep:      true,
  immediate: true
});

watch(yamlOption, (neu, old) => {
  switch (neu) {
  case VALUES_STATE.FORM:
    // Returning to form discards YAML edits and restores the last form snapshot.
    currentYamlValues.value = previousYamlValues.value;
    preYamlOption.value = VALUES_STATE.FORM;

    showForm.value = true;
    emit('editor', neu);
    break;

  case VALUES_STATE.YAML:
  case VALUES_STATE.DIFF:
    // Entering YAML/Compare from form takes a fresh snapshot.
    if (old === VALUES_STATE.FORM || !old) {
      currentYamlValues.value = formYamlValues.value || buildYamlFromForm();
      previousYamlValues.value = currentYamlValues.value;
    }

    if (neu === VALUES_STATE.DIFF) {
      // Ensure parent yaml mirror is up to date before showing diff.
      updateYamlValues();
    }

    showForm.value = false;
    emit('editor', neu);
    break;
  }
});

function generateYaml() {
  if (props.yamlValues?.length) {
    currentYamlValues.value = props.yamlValues;
  } else {
    currentYamlValues.value = formYamlValues.value || buildYamlFromForm();
  }
}

function buildYamlFromForm() {
  const rawPolicy = toRaw(props.chartValues.policy) || props.value;

  return saferDump(rawPolicy);
}

function loadValuesComponent() {
  if (props.value?.haveComponent('kubewarden/admission')) {
    // Dynamic import of the form component
    const importFn = props.value.importComponent('kubewarden/admission');

    valuesComponent.value = markRaw(defineAsyncComponent(importFn));
  }
}

function tabChanged() {
  window.scrollTo(0, 0);
}

function updateYamlValues() {
  emit('updateYamlValues', currentYamlValues.value);
}

function confirmBackToForm() {
  // User confirmed "Back to Form" from YAML/Compare.
  preYamlOption.value = VALUES_STATE.FORM;
  yamlOption.value = VALUES_STATE.FORM;
}

function cancelBackToForm() {
  // User chose to stay in YAML/Compare.
  preYamlOption.value = yamlOption.value;
}

onMounted(async() => {
  // Attempt to fetch chart version info
  try {
    version.value = store.getters['catalog/version']({
      repoType:  'cluster',
      repoName:  'kubewarden',
      chartName: KUBEWARDEN_CHARTS.CONTROLLER
    });
    loadValuesComponent();
  } catch (e) {
    console.warn(`Unable to fetch Version: ${ e }`);
  }

  generateYaml();
  originalYamlValues.value = currentYamlValues.value;
  previousYamlValues.value = currentYamlValues.value;

  // If creating a ClusterAdmissionPolicy, ensure default matchExpressions
  if (props.mode === _CREATE && props.chartValues?.policy?.kind === 'ClusterAdmissionPolicy') {
    if (!props.chartValues?.policy?.spec?.namespaceSelector) {
      props.chartValues.policy.spec.namespaceSelector = {};
    }
    props.chartValues.policy.spec.namespaceSelector.matchExpressions = [
      RANCHER_NS_MATCH_EXPRESSION
    ];
  }

  fetchPending.value = false;
});
</script>

<template>
  <Loading v-if="fetchPending" mode="relative" />
  <div v-else>
    <div v-if="isCreate || isEdit" class="step__values__controls">
      <ButtonGroup
        v-model:value="preYamlOption"
        data-testid="kw-policy-config-yaml-option"
        :options="formYamlOptions"
        inactive-class="bg-disabled btn-sm"
        active-class="bg-primary btn-sm"
      />
    </div>

    <div class="scroll__container">
      <div class="scroll__content">
        <!-- Show the form-based component if showForm is true -->
        <template v-if="showForm">
          <Tabbed
            ref="tabs"
            :side-tabs="true"
            class="step__values__content"
            @changed="tabChanged()"
          >
            <template v-if="valuesComponent">
              <component
                :is="valuesComponent"
                :value="chartValues"
                :mode="mode"
                :custom-policy="customPolicy"
                :error-fetching-policy="errorFetchingPolicy"
                :module-info="moduleInfo"
                @module-validation="$event => emit('module-validation', $event)"
              />
            </template>
          </Tabbed>
        </template>

        <!-- Otherwise, show the YAML editor -->
        <template v-else-if="(isCreate || isEdit) && !showForm">
          <YamlEditor
            ref="yaml"
            v-model:value="currentYamlValues"
            data-testid="kw-policy-config-yaml-editor"
            class="step__values__content"
            :scrolling="true"
            :initial-yaml-values="originalYamlValues"
            :editor-mode="editorMode"
            :hide-preview-buttons="false"
            @onChanges="updateYamlValues"
          />
        </template>

        <ResourceCancelModal
          ref="cancelModal"
          data-testid="kw-policy-config-yaml-cancel"
          :is-cancel-modal="false"
          :is-form="true"
          @cancel-cancel="cancelBackToForm"
          @confirm-cancel="confirmBackToForm"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$padding: 5px;

.step {
  &__values {
    &__controls {
      display: flex;
      margin-bottom: 15px;

      & > *:not(:last-of-type) {
        margin-right: $padding * 2;
      }

      &--spacer {
        flex: 1;
      }
    }

    &__content {
      flex: 1;

      :deep(.tab-container) {
        overflow: auto;
      }
    }
  }
}
</style>
