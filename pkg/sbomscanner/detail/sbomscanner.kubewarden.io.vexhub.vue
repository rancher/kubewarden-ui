<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import Masthead from '@shell/components/Resource/Detail/Masthead/index.vue';
import Date from '@shell/components/formatter/Date.vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import UriExternalLink from '@sbomscanner/formatters/UriExternalLink.vue';
import { computed } from 'vue';

const store = useStore();
const { t } = useI18n(store);
const props = defineProps<{
  value: any
}>();

const vexhub = props.value;

const defaultMastheadProps = computed(() => {
  return {
    titleBarProps: {
      resource:          vexhub,
      resourceName:      vexhub.metadata.name,
      resourceTypeLabel: t('imageScanner.vexManagement.title'),
      resourceTo:        vexhub.listLocation,
      description:       t('imageScanner.vexManagement.detail.description'),
      badge:             {
        color: vexhub.spec.enabled ? ('bg-success' as 'bg-success') : ('bg-error' as 'bg-error'),
        label: t(`imageScanner.enum.status.${vexhub.spec.enabled ? 'enabled' : 'disabled'}`)
      },
      actionMenuResource: vexhub,
      showViewOptions:    false
    },
    metadataProps: {
      resource:               vexhub,
      identifyingInformation: [
        {
          label:         'URI',
          value:         vexhub.spec.url,
          valueOverride: {
            component: UriExternalLink,
            props:     { value: vexhub.spec.url }
          }
        },
        {
          label: 'Created by',
          value: Number(vexhub.metadata.generation) === 1 ? 'Rancher' : 'Manual entry'
        },
        {
          label: 'Last sync',
          value: undefined, // TODO: Add last sync time when backend supports it
        },
        {
          label:         'Updated',
          value:         vexhub.metadata.creationTimestamp,
          valueOverride: {
            component: Date,
            props:     { value: vexhub.metadata.creationTimestamp }
          }
        }
      ],
      annotations: [],
      labels:      []
    }
  };
});
</script>

<template>
  <DetailPage>
    <template #top-area>
      <Masthead class="masthead" v-bind="defaultMastheadProps">
        <template #additional-actions>
          <button
            data-testid="detail-explore-button"
            type="button"
            class="btn role-primary actions"
            @click="value.toggle.invoke()"
          >
            <i :class="`icon ${value.toggle.icon}`"></i>
            {{ value.toggle.label }}
          </button>
        </template>
      </Masthead>
    </template>
  </DetailPage>
</template>

<style lang="scss" scoped>
.btn.actions {
  gap: 12px;
}

/* Hide empty labels and annotations section */
/* TODO: Remove when rancher provides option in their masthead component */
.masthead:deep(.labels-and-annotations-empty) {
  display: none;
}
</style>