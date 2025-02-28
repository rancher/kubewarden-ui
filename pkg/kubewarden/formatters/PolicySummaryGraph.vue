<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

import { sortBy } from '@shell/utils/sort';
import ProgressBarMulti from '@shell/components/ProgressBarMulti';

import { Policy } from '../types';
import { colorForStatus, stateSort } from '../plugins/kubewarden-class';

interface StatePart {
  value:      number;
  color:      string;
  sort:       string;
  key?:       string;
  label?:     string;
  textColor?: string;
}

const props = defineProps<{
  row: any;
  label: string;
  linkTo: object;
}>();

const isLoading = ref(false);
const relatedPolicies = ref<Policy[]>([]);

const show = computed(() => stateParts.value.length > 0);

const stateParts = computed(() => {
  const out: Record<string, StatePart> = {};

  for (const r of relatedPolicies.value) {
    const state = r?.status?.policyStatus || 'unknown';
    const textColor = colorForStatus(state);
    const key = `${ textColor }/${ state }`;

    if (out[key]) {
      out[key].value += 1;
    } else {
      out[key] = {
        key,
        label:     state,
        color:     textColor.replace(/text-/, 'bg-'),
        textColor,
        value:     1,
        sort:      stateSort(textColor, state),
      };
    }
  }

  return sortBy(Object.values(out), 'sort:desc', 'desc');
});

const colorParts = computed(() => {
  const out: Record<string, StatePart> = {};

  for (const p of stateParts.value) {
    if (out[p.color]) {
      out[p.color].value += 1;
    } else {
      out[p.color] = {
        color: p.color,
        value: p.value,
        sort:  p.sort,
      };
    }
  }

  return sortBy(Object.values(out), 'sort:desc', 'desc');
});

const displayLabel = computed(() => {
  const count = relatedPolicies.value.length || 0;

  if (props.label) {
    return `${ props.label }, ${ count }`;
  }

  return `${ count }`;
});

onMounted(async () => {
  isLoading.value = true;
  relatedPolicies.value = await props.row.allRelatedPolicies();
  isLoading.value = false;
});

onUnmounted(() => {
  relatedPolicies.value = [];
});
</script>

<template>
  <div>
    <div v-if="isLoading">
      <i class="icon icon-lg icon-spinner icon-spin" />
    </div>
    <VDropdown
      v-else-if="show"
      class="text-center hand"
      placement="top"
      :open-group="row.id"
      :trigger="show ? 'click' : 'manual'"
      offset="1"
    >
      <div class="column-content">
        <ProgressBarMulti :values="colorParts" class="mb-2" />
        <router-link v-if="linkTo" :to="linkTo">
          {{ displayLabel }}
        </router-link>
        <span v-else>{{ displayLabel }}</span>
      </div>
      

      <template #popper>
        <table v-if="show" class="fixed">
          <tbody>
            <tr v-for="obj in stateParts" :key="obj.key">
              <td class="text-left pr-20" :class="{[obj.textColor]: true}">
                {{ obj.label }}
              </td>
              <td class="text-right">
                {{ obj.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </VDropdown>
    <div v-else class="text-center text-muted">
      &mdash;
    </div>
  </div>
</template>

<style lang="scss">
.column-content {
  width: 100px;
}
</style>
