<template>
  <div class="page">
    <div class="header-section">
      <div class="header-left">
        <div class="title-wrap">
          <div class="title">
            {{ t('imageScanner.vexManagement.title') }}
          </div>
        </div>
        <div class="description">
          {{ t('imageScanner.vexManagement.description') }}
        </div>
      </div>
      <div class="header-right">
        <div class="header-btn">
          <button
            v-if="canEdit"
            class="btn role-primary"
            :aria-label="t('imageScanner.vexManagement.button.create')"
            type="button"
            @click="createVexHub()"
          >
            {{ t('imageScanner.vexManagement.button.create') }}
          </button>
        </div>
      </div>
    </div>

    <VexHubList />
  </div>
</template>

<script>
import {
  RESOURCE,
  PRODUCT_NAME,
} from '@sbomscanner/types';
import VexHubList from '@sbomscanner/list/sbomscanner.kubewarden.io.vexhub.vue';
import { getPermissions } from '@sbomscanner/utils/permissions';

export default {
  name:       'VexManagement',
  components: { VexHubList },
  data() {
    return { canEdit: getPermissions(this.$store.getters).canEdit };
  },
  methods: {
    createVexHub() {
      this.$router.push({
        name:   `${ PRODUCT_NAME }-c-cluster-resource-create`,
        params: {
          resource: RESOURCE.VEX_HUB,
          cluster:  this.$route.params.cluster,
          product:  PRODUCT_NAME
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  padding: 24px;
  min-height: 100%;
}

.header-section {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  align-self: stretch;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 8px;
    flex: 1 0 0;
  }

  .title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    align-self: stretch;

    .title {
      font-family: Lato;
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      line-height: 32px;
    }
  }

  .description {
    max-width: 900px;
    align-self: stretch;
    color: var(--disabled-text);
    font-family: Lato;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 21px;
  }

  .header-right {
    display: flex;
    align-items: flex-end;
    justify-content: end;
    flex: 1 0 0;
    gap: 24px;
  }

  .header-btn {
    height: 40px;
  }
}
</style>
