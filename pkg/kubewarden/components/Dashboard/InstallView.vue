<script>
import { mapGetters } from 'vuex';

import { CATALOG, SERVICE } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import { allHash } from '@shell/utils/promise';
import ResourceFetch from '@shell/mixins/resource-fetch';

import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import CopyCode from '@shell/components/CopyCode';
import Loading from '@shell/components/Loading';
import Markdown from '@shell/components/Markdown';

import { KUBEWARDEN_CHARTS, KUBEWARDEN_REPO } from '../../types';
import { getLatestStableVersion } from '../../plugins/kubewarden-class';
import { handleGrowl } from '../../utils/handle-growl';

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
    CopyCode,
    InstallWizard,
    Loading,
    Markdown
  },

  mixins: [ResourceFetch],

  async fetch() {
    this.reloadReady = false;

    if ( !this.hasSchema ) {
      const inStore = this.currentProduct.inStore;
      const hash = [];
      const listTypes = [SERVICE, CATALOG.CLUSTER_REPO];

      listTypes.forEach((type) => {
        if ( this.$store.getters[`${ inStore }/canList`](type) ) {
          hash.push(this.$fetchType(type));
        }
      });

      await allHash(hash);

      if ( this.certService ) {
        this.initStepIndex = 1;
        this.installSteps[0].ready = true;
      }

      if ( !this.kubewardenRepo || !this.controllerChart ) {
        await this.$store.dispatch('catalog/refresh');
      }
    }
  },

  data() {
    const installSteps = [
      {
        name:  'certmanager',
        label: 'Cert-Manager',
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
      reloadReady:   false,
      install:       false,
      initStepIndex: 0,
      docs:          { airgap: '' }
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
    async certService() {
      this.installSteps[0].ready = true;

      if ( this.isAirgap ) {
        await this.refreshCharts();
      }

      this.$refs.wizard?.goToStep(2);
    }
  },

  computed: {
    ...mapGetters(['currentCluster', 'currentProduct']),
    ...mapGetters({
      charts: 'catalog/charts', repos: 'catalog/repos', t: 'i18n/t'
    }),

    isAirgap() {
      return this.$store.getters['kubewarden/airGapped'];
    },

    certService() {
      return this.$store.getters[`${ this.currentProduct.inStore }/all`](SERVICE).find(s => s.metadata?.labels?.['app'] === 'cert-manager');
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
    },
  },

  methods: {
    async applyCertManager(btnCb) {
      try {
        // fetch cert-manager latest release and apply
        const url = '/meta/proxy/github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml';
        const res = await this.$store.dispatch('management/request', {
          url,
          headers:              { accept: 'application/yaml' },
          redirectUnauthorized: false
        }, { root: true });

        const yaml = res?.data;

        await this.currentCluster.doAction('apply', { yaml, defaultNamespace: 'cert-manager' });

        btnCb(true);
        this.installSteps[0].ready = true;
        this.$refs.wizard.next();
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
        btnCb(false);
      }
    },

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

        await this.refreshCharts();
        btnCb(true);
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
        btnCb(false);
      }
    },

    async refreshCharts(retry = 0, init) {
      try {
        await this.$store.dispatch('catalog/refresh');
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
      }

      if ( !this.controllerChart && retry === 0 ) {
        await this.$fetchType(CATALOG.CLUSTER_REPO);
        await this.refreshCharts(retry + 1);
      }

      if ( !this.controllerChart && retry === 1 && !init ) {
        this.reloadReady = true;
      }
    },

    async chartRoute() {
      if ( !this.controllerChart ) {
        try {
          await this.refreshCharts();
        } catch (e) {
          handleGrowl({ error: e, store: this.$store });

          return;
        }
      }

      const {
        repoType, repoName, chartName, versions
      } = this.controllerChart;
      const latestStableVersion = getLatestStableVersion(versions);

      if ( latestStableVersion ) {
        const query = {
          [REPO_TYPE]: repoType,
          [REPO]:      repoName,
          [CHART]:     chartName,
          [VERSION]:   latestStableVersion.version
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
        <Markdown v-model="docs.airgap" />
      </template>

      <!-- Non Air-Gapped -->
      <template v-else>
        <InstallWizard ref="wizard" :init-step-index="initStepIndex" :steps="installSteps">
          <template #certmanager>
            <h2 class="mt-20 mb-10" data-testid="kw-cm-title">
              {{ t("kubewarden.dashboard.prerequisites.certManager.title") }}
            </h2>
            <p class="mb-20">
              {{ t("kubewarden.dashboard.prerequisites.certManager.description") }}
            </p>

            <p v-clean-html="t('kubewarden.dashboard.prerequisites.certManager.manualStep', null, true)"></p>
            <CopyCode class="m-10 p-10" data-testid="kw-cm-copy-code">
              {{ t("kubewarden.dashboard.prerequisites.certManager.applyCommand") }}
            </CopyCode>
            <button
              data-testid="kw-cm-open-shell"
              :disabled="!shellEnabled"
              type="button"
              class="btn role-secondary"
              @shortkey="currentCluster.openShell()"
              @click="currentCluster.openShell()"
            >
              <i class="icon icon-terminal icon-lg" />{{ t("kubewarden.dashboard.prerequisites.certManager.openShell") }}
            </button>

            <slot>
              <Banner
                class="mb-20 mt-20"
                color="info"
                :label="t('kubewarden.dashboard.prerequisites.certManager.stepProgress')"
              />
            </slot>
          </template>

          <template #install>
            <template v-if="!kubewardenRepo">
              <h2 class="mt-20 mb-10" data-testid="kw-repo-title">
                {{ t("kubewarden.dashboard.prerequisites.repository.title") }}
              </h2>
              <p class="mb-20">
                {{ t("kubewarden.dashboard.prerequisites.repository.description") }}
              </p>

              <AsyncButton mode="kubewardenRepository" data-testid="kw-repo-add-button" @click="addRepository" />
            </template>

            <template v-else>
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
                    <button class="ml-10 btn btn-sm role-primary" @click="reload()">
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
