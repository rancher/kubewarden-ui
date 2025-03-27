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

function modeLink(server: PolicyServerDetails, mode: string) {
  return props.card.modeLink(server, { q: mode });
}
</script>

<template>
  <div class="policy-servers">
    <ul v-if="props.policyServers.length">
      <li v-for="server in props.policyServers" :key="server.metadata.name" class="policy-server-item">
        <span class="status-icon" :class="server._status" v-clean-tooltip="server._status" />
        <router-link
        :to="props.card.psLink(server)"
        class="server-name"
        >
          {{ server.metadata.name }}
        </router-link>
        <div class="server-modes">
          (
            <router-link :to="modeLink(server, 'protect')">{{ server._protectCount }} Protect</router-link>
            <span>&nbsp;/&nbsp;</span>
            <router-link :to="modeLink(server, 'monitor')">{{ server._monitorCount }} Monitor</router-link>
          )
        </div>
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

  & a {
    color: var(--text-color-secondary);
    text-decoration: none;
    cursor: pointer;
  }
}
</style>
