<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue';
import { RouteLocationRaw } from 'vue-router';

const { to } = defineProps<{
  to: RouteLocationRaw;
}>();

const instance = getCurrentInstance();

const href = computed(() => {
  if (!instance?.proxy?.$router) {
    return '#';
  }

  try {
    const resolved = instance.proxy.$router.resolve(to);

    return resolved.href;
  } catch (e) {
    console.error('[SubtleLink] Error resolving route:', e);

    return '#';
  }
});

function navigate(event: Event) {
  event.preventDefault();

  if (instance?.proxy?.$router) {
    instance.proxy.$router.push(to);
  }
}
</script>

<template>
  <a
    :href="href"
    class="subtle-link"
    @click="navigate"
  >
    <slot name="default" />
  </a>
</template>

<style lang="scss" scoped>
.subtle-link {
    text-decoration: underline;
    color: var(--body-text);
}
</style>
