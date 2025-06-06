<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useStore } from 'vuex';

import { allHash } from '@shell/utils/promise';

import { KUBEWARDEN } from '@kubewarden/constants';
import { UNIFIED_POLICY_HEADERS  } from '@kubewarden/config/table-headers';

import Loading from '@shell/components/Loading';
import SortableTable from '@shell/components/SortableTable';

import PolicyResources from '@kubewarden/formatters/PolicyResources';

const store = useStore();

const isLoading = ref(false);

const admissionPolicies = computed(() => store.getters['cluster/all'](KUBEWARDEN.ADMISSION_POLICY));
const clusterAdmissionPolicies = computed(() => store.getters['cluster/all'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY));
const admissionPolicyGroups = computed(() => store.getters['cluster/all'](KUBEWARDEN.ADMISSION_POLICY_GROUP));
const clusterAdmissionPolicyGroups = computed(() => store.getters['cluster/all'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY_GROUP));

const allPolicies = computed(() => [
  ...admissionPolicies.value,
  ...clusterAdmissionPolicies.value,
  ...admissionPolicyGroups.value,
  ...clusterAdmissionPolicyGroups.value
]);

function isGroup(policy: any) {
  return policy?.type === KUBEWARDEN.ADMISSION_POLICY_GROUP || policy?.type === KUBEWARDEN.CLUSTER_ADMISSION_POLICY_GROUP;
}

function getSource(policy: any) {
  if (isGroup(policy)) {
    return '-';
  }

  // `source` is defined in the policy-class model
  return policy.source;
}

onMounted(async() => {
  isLoading.value = true;
  const hash: Record<string, any> = {};
  const types: string[] = [
    KUBEWARDEN.ADMISSION_POLICY,
    KUBEWARDEN.CLUSTER_ADMISSION_POLICY,
    KUBEWARDEN.ADMISSION_POLICY_GROUP,
    KUBEWARDEN.CLUSTER_ADMISSION_POLICY_GROUP,
  ];

  types.forEach((type) => {
    if (store.getters['cluster/canList'](type)) {
      hash[type] = store.dispatch('cluster/findAll', { type });
    }
  });

  await allHash(hash);

  isLoading.value = false;
});
</script>

<template>
  <Loading v-if="isLoading" />
  <div v-else>
    <SortableTable
      :rows="allPolicies"
      :headers="UNIFIED_POLICY_HEADERS"
      key-field="id"
      group-by="kind"
      sub-expandable
      sub-expand-column
      sub-rows
      row-actions
      use-query-params-for-simple-filtering
    >

      <template #sub-row="{ row, fullColspan }">
        <td :colspan="fullColspan">
        <template v-if="isGroup(row)">
          <div class="sub-row-group">
            <h4>Policies</h4>
            <table class="sub-policy-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Module</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(sub, key) in row?.spec?.policies" :key="key">
                  <td>{{ key }}</td>
                  <td>{{ sub.module }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-else>
          <div class="sub-row-single">
            <div class="sub-row-section">
              <label>Policy Server</label>
              <div>{{ row?.spec?.policyServer || '-' }}</div>
            </div>
            <div class="sub-row-section">
              <label>Resources</label>
              <PolicyResources :value="row.spec?.rules" :col="{ name: 'resources' }" />
            </div>
            <div class="sub-row-section">
              <label>Source</label>
              <div>{{ getSource(row) }}</div>
            </div>
            <div class="sub-row-section">
              <label>Operations</label>
              <PolicyResources :value="row.spec?.rules" :col="{ name: 'operations' }" />
            </div>
          </div>
        </template>
        </td>
      </template>
    </SortableTable>

  </div>
</template>

<style lang="scss" scoped>
.sub-row-group {
  padding: 1rem;

  h4 {
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .sub-policy-table {
    width: 100%;
    border-collapse: collapse;

    thead {
      background: var(--sortable-table-row-bg);

      th {
        text-align: left;
        padding: 0.5rem;
      }
    }

    tbody {
      tr {
        td {
          padding: 0.5rem;
        }
      }
    }
  }
}

.sub-row-single {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 1rem;
  padding: 1rem;

  .sub-row-section {
    background: var(--sortable-table-row-bg);
    border-radius: 4px;
    padding: 1rem;

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
  }
}
</style>
