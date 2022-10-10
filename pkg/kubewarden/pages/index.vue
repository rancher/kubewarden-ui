<script>
import { mapGetters } from 'vuex';

import { Banner } from '@components/Banner';
import CopyCode from '@shell/components/CopyCode';

export default {
  name: 'Dashboard',

  components: { Banner, CopyCode },

  computed: { ...mapGetters['currentCluster'] }
};
</script>

<template>
  <div class="main">
    <div class="container">
      <div class="title m-20 p-10">
        <div class="logo mt-20 mb-10">
          <img src="../assets/icon-kubewarden.svg" height="64" />
        </div>
        <h1 class="mb-10">
          {{ t('kubewarden.title') }}
        </h1>
        <div>
          {{ t('kubewarden.install.description' ) }}
        </div>
      </div>

      <hr class="m-20" />

      <h2 class="mb-10">
        {{ t('kubewarden.install.instructions.prerequisites') }}
      </h2>
      <Banner color="info" :label="t('kubewarden.install.instructions.certManager.description')" />
      <div>
        <h4 v-html="t('kubewarden.install.instructions.certManager.step', null, true)"></h4>
        <CopyCode class="m-10 p-10">
          {{ t('kubewarden.install.instructions.certManager.applyCommand') }}
        </CopyCode>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main {
  & .title {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
}

</style>
