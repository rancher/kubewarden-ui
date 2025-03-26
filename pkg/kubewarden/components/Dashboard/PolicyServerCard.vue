<script setup lang="ts">
import { PolicyServer } from '@kubewarden/types';

interface PolicyServerDetails extends PolicyServer {
  _status: 'running' | 'pending' | 'error' | 'stopped';
  _totalPods: number;
  _runningCount: number;
  _pendingCount: number;
  _errorCount: number;
  _monitorCount: number;
  _protectCount: number;
}

const props = defineProps<{
  policyServers: PolicyServerDetails[];
  card: any;
}>();
</script>

<template>
  <div class="policy-servers">
    <ul v-if="props.policyServers.length">
      <li v-for="server in props.policyServers" :key="server.metadata.name" class="policy-server-item">
        <span class="status-icon" :class="server._status" />
        <!-- <span class="server-name">{{ server.metadata.name }}</span> -->
         <router-link
          :to="props.card.psLink(server)"
          class="server-name"
         >
          {{ server.metadata.name }}
         </router-link>
        <span class="server-modes">
          ({{ server._monitorCount }} Monitor / {{ server._protectCount }} Protect)
        </span>
      </li>
    </ul>
    <p v-else>No policy servers found.</p>
  </div>
</template>

<style scoped>
.policy-servers ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.policy-server-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.status-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

/* Example colors, tweak as needed */
.status-icon.running {
  background-color: var(--success);
}
.status-icon.pending {
  background-color: var(--warning);
}
.status-icon.error,
.status-icon.stopped {
  background-color: var(--error);
}

.server-name {
  font-weight: 600;
  margin-right: 8px;
}

.server-modes {
  color: var(--text-color-secondary);
}
</style>
