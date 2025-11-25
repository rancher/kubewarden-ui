<script setup lang="ts">
const props = defineProps<{
  groupSpec: {
    backgroundAudit: boolean;
    mode: string;
    policyServer: string;
  };
}>();
</script>

<template>
 <section>
   <p class="text mb-5"><strong>Background Audit:</strong> {{ props.groupSpec.backgroundAudit }}</p>
   <p class="text mb-5"><strong>Mode:</strong> {{ props.groupSpec.mode }}</p>
   <p class="text mb-5"><strong>PolicyServer:</strong> {{ props.groupSpec.policyServer }}</p>
 </section>
</template>
