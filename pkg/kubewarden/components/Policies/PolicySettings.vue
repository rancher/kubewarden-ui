<script setup lang="ts">
import jsYaml from 'js-yaml';

import CodeMirror from '@shell/components/CodeMirror';

const props = defineProps<{
  policy: Record<string, any>;
}>();

function parsedSettings(policy) {
  try {
    return jsYaml.dump(policy.settings);
  } catch (error) {
    console.error(`Error parsing settings for policy ${ policy.name }:`, error);

    return {};
  }
}
</script>

<template>
  <section class="col">
    <div class="mb-5">Settings</div>
    <CodeMirror
      :ref="`cm-${ props.policy.name }`"
      :value="parsedSettings(props.policy)"
      :data-testid="`kw-${ props.policy.name }-cm`"
      mode="view"
      class="p-10"
      as-text-area
    />
  </section>
</template>
