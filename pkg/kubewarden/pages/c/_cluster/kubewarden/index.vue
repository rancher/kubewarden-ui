<script>
import { mapGetters } from 'vuex';
import { CATALOG } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';

import { Banner } from '@components/Banner';
import CopyCode from '@shell/components/CopyCode';
import Loading from '@shell/components/Loading';

export default {
  name: 'Dashboard',

  components: {
    Banner, CopyCode, Loading
  },

  async fetch() {
    // Check to see that the charts we need are available
    await this.$store.dispatch('catalog/load');

    const charts = this.$store.getters['catalog/charts'];
    const chartValues = Object.values(charts);

    this.controllerChart = chartValues.find(chart => chart.chartName === 'kubewarden-controller');

    if ( this.controllerChart ) {
      this.getStartedLink = {
        name:    'c-cluster-apps-charts-install',
        params: {
          cluster:  this.$route.params.cluster,
          product:  CATALOG.APP,
        },
        query: {
          [REPO_TYPE]: this.controllerChart.repoType,
          [REPO]:      this.controllerChart.repoName,
          [CHART]:     this.controllerChart.chartName,
          [VERSION]:   this.controllerChart.versions[0].version
        }
      };
    }
  },

  data() {
    return {
      controllerChart: null,
      getStartedLink:  null
    };
  },

  computed: { ...mapGetters['currentCluster'] }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="main">
    <div class="container">
      <div class="title p-10">
        <div class="logo mt-20 mb-20">
          <img src="https://www.kubewarden.io/images/logo-kubewarden.svg" height="64" />
        </div>
        <div class="description">
          {{ t('kubewarden.install.description' ) }}
        </div>

        <template v-if="getStartedLink">
          <nuxt-link
            :to="getStartedLink"
            class="btn role-secondary mt-20"
          >
            {{ t('kubewarden.install.getStarted') }}
          </nuxt-link>
        </template>

        <template v-else>
          <Banner color="warning" :label="t('kubewarden.install.prerequisites.repositoryWarning')" />
        </template>
      </div>

      <hr class="m-20" />

      <h2 class="mb-10">
        {{ t('kubewarden.install.prerequisites.title') }}
      </h2>
      <Banner color="info" :label="t('kubewarden.install.prerequisites.certManager.description')" />
      <div>
        <h4 v-html="t('kubewarden.install.prerequisites.certManager.step', null, true)"></h4>
        <CopyCode class="m-10 p-10">
          {{ t('kubewarden.install.prerequisites.certManager.applyCommand') }}
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
    margin: 100px 0;
  }

  & .description {
    line-height: 20px;
  }
}
</style>
