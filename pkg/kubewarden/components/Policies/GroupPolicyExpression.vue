<script setup lang="ts">
const props = defineProps<{
  policy: Record<string, any>;
  activeTab: string;
}>();
</script>

<template>
  <section class="col">
    <div class="mb-5">Expression</div>
    <div class="expression-container">
      {{ props.policy.spec?.expression }}
    </div>
  </section>
</template>

<style lang="scss" scoped>
.expression-container {
  min-height: 40px;
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: 10px;
  background-color: var(--input-bg);
  border-radius: var(--border-radius);
  border: solid var(--border-width) var(--input-border);
  color: var(--input-text);
}
</style>
