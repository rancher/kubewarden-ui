<script setup lang="ts">
import {
  ref,
  onMounted,
  watch,
  computed
} from 'vue';
import { useStore } from 'vuex';
import { defineAsyncComponent, toRaw } from 'vue';
import isEmpty from 'lodash/isEmpty';

import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';
import { createYaml, saferDump } from '@shell/utils/create-yaml';

import ButtonGroup from '@shell/components/ButtonGroup';
import Loading from '@shell/components/Loading';
import ResourceCancelModal from '@shell/components/ResourceCancelModal';
import Tabbed from '@shell/components/Tabbed';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';

import {
  KUBEWARDEN_CHARTS,
  VALUES_STATE,
  YAML_OPTIONS,
  RANCHER_NS_MATCH_EXPRESSION
} from '../../types';

interface Props {
  mode: string;
  chartValues: Record<string, any>;
  customPolicy: boolean;
  value: Record<string, any>;
  yamlValues: string;
}

const props = defineProps<Props>();
const store = useStore();
const emit = defineEmits(['editor', 'updateYamlValues']);

const fetchPending = ref(true);

const currentYamlValues = ref('');
const originalYamlValues = ref('');
const showForm = ref(true);
const valuesComponent = ref<any>(null);
const preYamlOption = ref(VALUES_STATE.FORM);
const yamlOption = ref(VALUES_STATE.FORM);
const version = ref<any>(null);

const editorMode = computed(() => EDITOR_MODES.EDIT_CODE);
const isCreate = computed(() => props.mode === _CREATE);
const isEdit = computed(() => props.mode === _EDIT);

watch(yamlOption, (neu, old) => {
  switch (neu) {
  case VALUES_STATE.FORM:
    showForm.value = true;
    emit('editor', neu);
    break;
  case VALUES_STATE.YAML:
    // Switching to YAML view from form
    if (old === VALUES_STATE.FORM) {
      currentYamlValues.value = saferDump(props.chartValues.policy);
      updateYamlValues();
    }

    showForm.value = false;
    emit('editor', neu);
    break;
  }
});

function generateYaml() {
  const schemas = store.getters['cluster/all'](SCHEMA);

  const rawPolicy = toRaw(props.chartValues.policy);
  // Fallback to props.value if there is no policy
  const cloned = rawPolicy ? structuredClone(rawPolicy) : props.value;

  if (props.yamlValues?.length) {
    currentYamlValues.value = props.yamlValues;
  } else {
    currentYamlValues.value = createYaml(schemas, props.value?.type, cloned);
  }
}

function loadValuesComponent() {
  if (props.value?.haveComponent('kubewarden/admission')) {
    // Dynamic import of the form component
    const importFn = props.value.importComponent('kubewarden/admission');
    valuesComponent.value = defineAsyncComponent(importFn);
  }
}

function tabChanged() {
  window.scrollTo(0, 0);
}

function updateYamlValues() {
  emit('updateYamlValues', currentYamlValues.value);
}

onMounted(async () => {
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
        v-model:value="yamlOption"
        data-testid="kw-policy-config-yaml-option"
        :options="YAML_OPTIONS"
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
            :hide-preview-buttons="true"
            @onChanges="updateYamlValues"
          />
        </template>

        <ResourceCancelModal
          ref="cancelModal"
          data-testid="kw-policy-config-yaml-cancel"
          :is-cancel-modal="false"
          :is-form="true"
          @cancel-cancel="preYamlOption = yamlOption"
          @confirm-cancel="yamlOption = preYamlOption"
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
