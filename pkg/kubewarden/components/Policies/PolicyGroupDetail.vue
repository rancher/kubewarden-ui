<script setup lang="ts">
import { computed, ref } from 'vue';

import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';

import GroupOverview from '@kubewarden/components/Policies/GroupOverview.vue';
import GroupPoliciesTable from '@kubewarden/components/Policies/GroupPoliciesTable.vue';
import GroupPolicyExpression from '@kubewarden/components/Policies/GroupPolicyExpression.vue';

interface Props {
  mode?: string;
  value?: Record<string, any>;
  resource?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  mode:     'create',
  value:    () => ({}),
  resource: () => ({})
});

const activeTab = ref('group-overview');

const hasRelationships = computed(() => {
  return !!props.value?.metadata?.relationships;
});

const groupSpec = computed(() => {
  return props.value.spec || {};
});

const policyMap = computed(() => {
  return groupSpec.value?.policies || {};
});

const expression = computed(() => {
  return groupSpec.value?.expression || '';
});

function handleTabChange(tabName: string) {
  activeTab.value = tabName;
}
</script>

<template>
  <div>
    <ResourceTabs
      :value="value"
      :mode="mode"
      :need-related="hasRelationships"
    >
      <Tab name="group-overview" label="Overview" :weight="99" @activeTab="handleTabChange('group-overview')">
        <GroupOverview :group-spec="groupSpec" />
      </Tab>

      <Tab
        v-if="policyMap"
        name="group-policies"
        label="Policies"
        :weight="98"
        @activeTab="handleTabChange('group-policies')"
      >
        <GroupPoliciesTable :policies="policyMap" :active-tab="activeTab" />
      </Tab>

      <Tab
        v-if="expression"
        name="group-expression"
        label="Expression"
        :weight="97"
        @activeTab="handleTabChange('group-expression')"
      >
        <GroupPolicyExpression :policy="value" :active-tab="activeTab" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
