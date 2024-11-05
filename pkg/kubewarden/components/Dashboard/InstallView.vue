<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';

import { CATALOG } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import ResourceFetch from '@shell/mixins/resource-fetch';

import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import Markdown from '@shell/components/Markdown';

import { KUBEWARDEN_CHARTS, KUBEWARDEN_REPO } from '../../types';
import { getLatestVersion } from '../../plugins/kubewarden-class';
import { handleGrowl } from '../../utils/handle-growl';
import { refreshCharts } from '../../utils/chart';

import InstallWizard from '../InstallWizard';

export default {
  props: {
    hasSchema: {
      type:     Object,
      default:  null
    }
  },

  components: {
    AsyncButton,
    Banner,
    InstallWizard,
    Loading,
    Markdown
  },

  mixins: [ResourceFetch],

  async fetch() {
    this.debouncedRefreshCharts = debounce((init = false) => {
      refreshCharts({
        store: this.$store, chartName: KUBEWARDEN_CHARTS.DEFAULTS, init
      });
    }, 500);

    this.reloadReady = false;

    if ( !this.hasSchema ) {
      if (this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO)) {
        await this.$fetchType(CATALOG.CLUSTER_REPO);
      }

      if (this.controllerChart) {
        this.initStepIndex = 1;
        this.installSteps[0].ready = true;
      }

      if ( !this.kubewardenRepo || !this.controllerChart ) {
        this.debouncedRefreshCharts(true);
      }
    }
  },

  data() {
    const installSteps = [
      {
        name:  'repository',
        label: 'Repository',
        ready: false,
      },
      {
        name:  'install',
        label: 'App Install',
        ready: false,
      },
    ];

    return {
      installSteps,
      debouncedRefreshCharts: null,
      reloadReady:            false,
      install:                false,
      initStepIndex:          0,
      docs:                   { airgap: '' },
    };
  },

  async mounted() {
    if ( this.isAirgap ) {
      const docs = (await import(/* webpackChunkName: "airgap-docs" */ '../../assets/airgap-installation.md'));

      if ( docs ) {
        this.docs.airgap = docs.body;
      }
    }
  },

  watch: {
    controllerChart() {
      this.installSteps[0].ready = true;

      if ( this.isAirgap ) {
        this.debouncedRefreshCharts();
      }

      this.$refs.wizard?.goToStep(2);
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({
      charts: 'catalog/charts', repos: 'catalog/repos', t: 'i18n/t'
    }),

    isAirgap() {
      return this.$store.getters['kubewarden/airGapped'];
    },

    controllerChart() {
      if ( this.kubewardenRepo ) {
        return this.$store.getters['catalog/chart']({
          repoName:  this.kubewardenRepo.id,
          repoType:  'cluster',
          chartName: KUBEWARDEN_CHARTS.CONTROLLER
        });
      }

      return null;
    },

    kubewardenRepo() {
      const chart = this.charts?.find(chart => chart.chartName === KUBEWARDEN_CHARTS.CONTROLLER);

      return this.repos?.find(repo => repo.id === chart?.repoName);
    },

    shellEnabled() {
      return !!this.currentCluster?.links?.shell;
    }
  },

  methods: {
    async addRepository(btnCb) {
      try {
        const repoObj = await this.$store.dispatch('cluster/create', {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: 'kubewarden-charts' },
          spec:     { url: KUBEWARDEN_REPO },
        });

        try {
          await repoObj.save();
        } catch (e) {
          handleGrowl({ error: e, store: this.$store });
          btnCb(false);

          return;
        }

        if ( !this.controllerChart ) {
          this.debouncedRefreshCharts();
        }
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
        btnCb(false);
      }
    },

    chartRoute() {
      if ( !this.controllerChart ) {
        try {
          this.debouncedRefreshCharts();
        } catch (e) {
          handleGrowl({ error: e, store: this.$store });

          return;
        }
      }

      const {
        repoType, repoName, chartName, versions
      } = this.controllerChart;

      const latestChartVersion = getLatestVersion(this.$store, versions);

      if ( latestChartVersion ) {
        const query = {
          [REPO_TYPE]: repoType,
          [REPO]:      repoName,
          [CHART]:     chartName,
          [VERSION]:   latestChartVersion
        };

        this.$router.push({
          name:   'c-cluster-apps-charts-install',
          params: { cluster: this.currentCluster?.id || '_' },
          query,
        });
      } else {
        const error = {
          _statusText: this.t('kubewarden.dashboard.appInstall.versionError.title'),
          message:     this.t('kubewarden.dashboard.appInstall.versionError.message')
        };

        handleGrowl({ error, store: this.$store });
      }
    },

    reload() {
      this.$router.go();
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="container">
    <div v-if="!install" class="title p-10">
      <div class="logo mt-20 mb-10">
        <img
          src="../../assets/icon-kubewarden.svg"
          height="64"
        />
      </div>
      <h1 class="mb-20" data-testid="kw-install-title">
        {{ t("kubewarden.title") }}
      </h1>
      <div class="description">
        {{ t("kubewarden.dashboard.description") }}
      </div>
      <button v-if="!hasSchema" class="btn role-primary mt-20" data-testid="kw-initial-install-button" @click="install = true">
        {{ t("kubewarden.dashboard.appInstall.button") }}
      </button>
    </div>

    <template v-else>
      <!-- Air-Gapped -->
      <template v-if="isAirgap">
        <Banner
          class="mb-20 mt-20"
          color="warning"
        >
          <span data-testid="kw-install-ag-warning">{{ t('kubewarden.dashboard.prerequisites.airGapped.warning') }}</span>
        </Banner>
        <Markdown v-model:value="docs.airgap" />
      </template>

      <!-- Non Air-Gapped -->
      <template v-else>
        <InstallWizard ref="wizard" :init-step-index="initStepIndex" :steps="installSteps" data-testid="kw-install-wizard">
          <template #repository>
            <h2 class="mt-20 mb-10" data-testid="kw-repo-title">
              {{ t("kubewarden.dashboard.prerequisites.repository.title") }}
            </h2>
            <p class="mb-20">
              {{ t("kubewarden.dashboard.prerequisites.repository.description") }}
            </p>

            <AsyncButton mode="kubewardenRepository" data-testid="kw-repo-add-button" @click="addRepository" />
          </template>

          <template #install>
            <h2 class="mt-20 mb-10" data-testid="kw-app-install-title">
              {{ t("kubewarden.dashboard.appInstall.title") }}
            </h2>
            <p class="mb-20">
              {{ t("kubewarden.dashboard.appInstall.description") }}
            </p>

            <div class="chart-route">
              <Loading v-if="!controllerChart && !reloadReady" mode="relative" class="mt-20" />

              <template v-else-if="!controllerChart && reloadReady">
                <Banner color="warning">
                  <span class="mb-20">
                    {{ t('kubewarden.dashboard.appInstall.reload' ) }}
                  </span>
                  <button data-testid="kw-app-install-reload" class="ml-10 btn btn-sm role-primary" @click="reload()">
                    {{ t('generic.reload') }}
                  </button>
                </Banner>
              </template>

              <template v-else>
                <button
                  data-testid="kw-app-install-button"
                  class="btn role-primary mt-20"
                  :disabled="!controllerChart"
                  @click.prevent="chartRoute"
                >
                  {{ t("kubewarden.dashboard.appInstall.button") }}
                </button>
              </template>
            </div>
          </template>
        </InstallWizard>
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.container {
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

  & .chart-route {
    position: relative;
  }

  & .airgap-align {
    justify-content: start;
  }
}
</style>
