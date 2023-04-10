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

import { KUBEWARDEN_CHARTS, KUBEWARDEN_REPO } from '../../types';
import { getLatestStableVersion } from '../../plugins/kubewarden-class';

import InstallWizard from './InstallWizard';

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
    Loading
  },

  mixins: [ResourceFetch],

  async fetch() {
    this.reloadReady = false;

    if ( !this.hasSchema ) {
      const hash = [
        this.$fetchType(SERVICE),
        this.$fetchType(CATALOG.CLUSTER_REPO)
      ];

      await allHash(hash);

      if ( this.certService ) {
        this.initStepIndex = 1;
        this.installSteps[0].ready = true;
      }

      await this.refreshCharts(1, true);
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
      reloadReady:   false,
      install:       false,
      initStepIndex: 0,
      installSteps,
    };
  },

  watch: {
    certService() {
      this.installSteps[0].ready = true;

      this.$refs.wizard?.goToStep(2);
    }
  },

  computed: {
    ...mapGetters(['currentCluster', 'currentProduct']),
    ...mapGetters({ allRepos: 'catalog/repos' }),

    certService() {
      return this.$store.getters[`${ this.currentProduct.inStore }/all`](SERVICE).find(s => s.metadata?.labels?.['app'] === 'cert-manager');
    },

    controllerChart() {
      return this.$store.getters['catalog/chart']({ chartName: KUBEWARDEN_CHARTS.CONTROLLER });
    },

    kubewardenRepo() {
      return this.allRepos?.find(r => r.spec.url === KUBEWARDEN_REPO);
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
        this.$store.dispatch('growl/fromError', e);
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
          this.handleGrowlError(e);
          btnCb(false);

          return;
        }

        await this.refreshCharts();
        btnCb(true);
      } catch (e) {
        this.handleGrowlError(e);
        btnCb(false);
      }
    },

    async refreshCharts(retry = 0, init) {
      try {
        await this.$store.dispatch('catalog/load', { force: true, reset: true });
      } catch (e) {
        this.handleGrowlError(e);
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
          this.handleGrowlError(e);

          return;
        }
      }

      const {
        repoType, repoName, chartName, versions
      } = this.controllerChart;
      const latestStableVersion = getLatestStableVersion(versions);

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
    },

    reload() {
      this.$router.go();
    },

    handleGrowlError(e) {
      const error = e?.data || e;

      this.$store.dispatch('growl/error', {
        title:   error._statusText,
        message: error.message,
        timeout: 5000,
      }, { root: true });
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
      <h1 class="mb-20">
        {{ t("kubewarden.title") }}
      </h1>
      <div class="description">
        {{ t("kubewarden.dashboard.description") }}
      </div>
      <button v-if="!hasSchema" class="btn role-primary mt-20" @click="install = true">
        {{ t("kubewarden.dashboard.appInstall.button") }}
      </button>
    </div>

    <InstallWizard v-else ref="wizard" :init-step-index="initStepIndex" :steps="installSteps">
      <template #certmanager>
        <h2 class="mt-20 mb-10">
          {{ t("kubewarden.dashboard.prerequisites.certManager.title") }}
        </h2>
        <p class="mb-20">
          {{ t("kubewarden.dashboard.prerequisites.certManager.description") }}
        </p>

        <p v-html="t('kubewarden.dashboard.prerequisites.certManager.manualStep', null, true)"></p>
        <CopyCode class="m-10 p-10">
          {{ t("kubewarden.dashboard.prerequisites.certManager.applyCommand") }}
        </CopyCode>
        <button
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
          <h2 class="mt-20 mb-10">
            {{ t("kubewarden.dashboard.prerequisites.repository.title") }}
          </h2>
          <p class="mb-20">
            {{ t("kubewarden.dashboard.prerequisites.repository.description") }}
          </p>

          <AsyncButton mode="kubewardenRepository" @click="addRepository" />
        </template>

        <template v-else>
          <h2 class="mt-20 mb-10">
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
}
</style>
