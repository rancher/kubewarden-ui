<template>
  <div class="registry-details">
    <div class="about">
      <div class="header">
        <div class="resource-header">
          <h1
            class="resource-header-name-state"
            style="margin-bottom: 4px;"
          >
            <RouterLink
              class="resource-link"
              :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${PAGE.VEX_MANAGEMENT}`"
            >
              {{ t('imageScanner.vexManagement.title') }}:
            </RouterLink>
            <span class="resource-header-name">
              {{ $route.params.id }}
            </span>
            <StatusBadge
              style="margin-left: 12px; margin-top: 6px;"
              :status="vexHub.spec.enabled ? VEX_STATUS.ENABLED : VEX_STATUS.DISABLED"
            />
          </h1>
          <span class="resource-header-description">
            {{ t('imageScanner.vexManagement.detail.description') }}
          </span>
        </div>
        <div
          v-if="canEdit"
          class="resource-header-actions"
        >
          <button
            class="btn role-secondary"
            aria-label="Refresh data"
            type="button"
            @click="toggleStatus()"
          >
            <i :class="`icon ${vexHub?.spec?.enabled ? 'icon-pause' : 'icon-play'} `"></i>
            {{ vexHub?.spec?.enabled ? t('imageScanner.vexManagement.buttons.disable') : t('imageScanner.vexManagement.buttons.enable') }}
          </button>
          <ActionMenu
            v-if="vexHub"
            button-role="multiAction"
            :resource="vexHub"
            data-testid="masthead-action-menu"
            :button-aria-label="t('component.resource.detail.titleBar.ariaLabel.actionMenu', { resource: RESOURCE.REGISTRY })"
          />
        </div>
      </div>
      <RancherMeta
        :properties="vexHubMetadata"
        :is-grid="false"
      />
    </div>
  </div>
</template>

<script>
import { PRODUCT_NAME, RESOURCE, PAGE, VEX_STATUS } from '@sbomscanner/types';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import RancherMeta from './common/RancherMeta.vue';
import StatusBadge from './common/StatusBadge.vue';
import { getPermissions } from '@sbomscanner/utils/permissions';
import day from 'dayjs';

export default {
  name:       'RegistryDetails',
  components: {
    RancherMeta,
    StatusBadge,
    ActionMenu
  },
  data() {
    return {
      PRODUCT_NAME,
      RESOURCE,
      PAGE,
      vexHub:         null,
      vexHubStatus:   null,
      vexHubMetadata: [],
      canEdit:        getPermissions(this.$store.getters).canEdit,
      VEX_STATUS,
    };
  },
  async fetch() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.vexHub = await this.$store.dispatch('cluster/find', { type: RESOURCE.VEX_HUB, id: this.$route.params.id });
      this.vexHubMetadata = [
        {
          type:  'link',
          label: this.t('imageScanner.vexManagement.table.headers.uri'),
          value: this.vexHub.spec.url
        },
        {
          type:  'text',
          label: this.t('imageScanner.vexManagement.table.headers.createdBy'),
          value: Number(this.vexHub.metadata.generation) === 1 ? 'Rancher' : 'Manual entry'
        },
        {
          type:  'text',
          label: this.t('imageScanner.vexManagement.table.headers.lastSync'),
          value: undefined, // TODO: Add last sync time when backend supports it
        },
        {
          type:  'text',
          label: this.t('imageScanner.vexManagement.table.headers.updated'),
          value: day(this.vexHub.metadata.creationTimestamp).format('MMM DD, YYYY HH:mm a'),
        },
      ];
    },
    toggleStatus() {
      this.vexHub.toggle.invoke();
    }
  },
};
</script>

<style lang="scss" scoped>
  .btn {
    padding: 0 16px;
    gap: 12px;
  }

  .registry-details {
    display: flex;
    padding: 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
    flex: 1 0 0;
    align-self: stretch;
  }

  .about {
    /* layout */
    display: flex;
    padding-bottom: 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    align-self: stretch;
    /* style */
    border-bottom: dashed var(--border-width) var(--input-border);

    .header {
      /* layout */
      display: flex;
      align-items: flex-start;
      gap: 24px;
      align-self: stretch;
      /* style */
      border-radius: 6px;
      min-width: 740px;

      .resource-header {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: 4px;
        flex: 1 0 0;
        max-width: calc(100% - 350px);

        .resource-header-name-state {
          display: flex;
          align-items: center;
          max-width: 100%;

          .resource-header-name {
            display: inline-block;
            flex: 1;
            white-space: nowrap;
            overflow-x: hidden;
            overflow-y: clip;
            text-overflow: ellipsis;
            margin-left: 4px;
          }
        }

        .resource-header-description {
          /* layout */
          display: flex;
          max-width: 900px;
          height: 21px;
          flex-direction: column;
          justify-content: center;
          /* typography */
          overflow: hidden;
          color: var(--disabled-text);
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: Lato;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 21px; /* 150% */
        }
      }

      .resource-header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-left: auto;

        &:deep() button[data-testid="masthead-action-menu"] {
          border-radius: 4px;
          width: 35px;
          height: 40px;

          display: inline-flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
        }
      }
    }
  }
</style>
