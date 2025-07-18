<script setup lang="ts">
import { computed, toRaw } from 'vue';

import SortableTable from '@shell/components/SortableTable';

import { GROUP_POLICY_TABLE_HEADERS } from '@kubewarden/config/table-headers';

import PolicySettings from '@kubewarden/components/Policies/PolicySettings';

const props = defineProps({
  policies: {
    type:    Object,
    default: () => ({})
  }
});

const mappedPolicies = computed(() => {
  const entries = Object.entries(props.policies);

  return entries.map(([key, value]) => ({
    name: key,
    ...toRaw(value)
  }));
});
</script>

<template>
  <SortableTable
    :headers="GROUP_POLICY_TABLE_HEADERS"
    :rows="mappedPolicies"
    :table-actions="false"
    :row-actions="false"
    key-field="name"
    default-sort-by="name"
    :paging="true"
    :search="false"
    :sub-expandable="true"
    :sub-expand-column="true"
    :sub-rows="true"
  >
    <template #sub-row="{row, fullColspan}">
      <td :colspan="fullColspan" class="sub-row">
        <div class="details">
          <PolicySettings :policy="row" />
        </div>
      </td>
    </template>
  </SortableTable>
</template>
