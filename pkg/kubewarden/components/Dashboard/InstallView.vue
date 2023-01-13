<script>
import { mapGetters } from 'vuex';

import { CATALOG, SERVICE } from '@shell/config/types';

import AsyncButton from '@shell/components/AsyncButton';
import CopyCode from '@shell/components/CopyCode';

import { Banner } from '@components/Banner';

import { KUBEWARDEN_REPO } from '../../types';

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
    InstallWizard
  },

  async fetch() {
    if ( !this.hasSchema ) {
      await this.$store.dispatch(`${ this.currentProduct.inStore }/findAll`, { type: SERVICE });

      if ( this.certService ) {
        this.initStepIndex = 1;
        this.installSteps[0].ready = true;
      }

      await this.getChartRoute();
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
      errors: [],

      allRepos:        null,
      controllerChart: null,
      kubewardenRepo:  null,
      install:         false,

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

    certService() {
      return this.$store.getters[`${ this.currentProduct.inStore }/all`](SERVICE).find(s => s.metadata?.labels?.['app'] === 'cert-manager');
    },

    installReady() {
      return !!this.controllerChart;
    },

    shellEnabled() {
      return !!this.currentCluster?.links?.shell;
    },
  },

  methods: {
    async applyCertManager(btnCb) {
      try {
        this.errors = [];

        // fetch cert-manager latest release and apply
        const url = '/meta/proxy/github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml';
        const res = await this.$store.dispatch('management/request', {
          url,
          headers:              { accept: 'application/yaml' },
          redirectUnauthorized: false
        }, { root: true });

        const yaml = res?.data;

        // await updateWhitelist('github.com', true);
        await this.currentCluster.doAction('apply', { yaml, defaultNamespace: 'cert-manager' });

        btnCb(true);
        this.installSteps[0].ready = true;
        this.$refs.wizard.next();
      } catch (err) {
        this.errors = err;
        btnCb(false);
      }
    },

    async addRepository(btnCb) {
      try {
        this.errors = [];

        const repoObj = await this.$store.dispatch('cluster/create', {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: 'kubewarden-charts' },
          spec:     { url: 'https://charts.kubewarden.io' },
        });

        await repoObj.save();

        await this.getChartRoute();

        btnCb(true);
      } catch (err) {
        this.errors = err;
        btnCb(false);
      }
    },

    async getChartRoute(retry = 0) {
      const allRepos = await this.$store.dispatch(`${ this.currentProduct.inStore }/findAll`, { type: CATALOG.CLUSTER_REPO });

      this.kubewardenRepo = allRepos?.find(r => r.spec.url === KUBEWARDEN_REPO);

      if ( !this.kubewardenRepo ) {
        return;
      }

      await this.$store.dispatch('catalog/load', { force: true });

      // Check to see that the chart we need are available
      const charts = this.$store.getters['catalog/rawCharts'];
      const chartValues = Object.values(charts);

      this.controllerChart = chartValues.find(
        chart => chart.chartName === 'kubewarden-controller'
      );

      if ( !this.controllerChart && retry === 0 ) {
        await this.getChartRoute(retry + 1);
      }
    },

    async chartRoute() {
      if ( !this.controllerChart ) {
        try {
          await this.getChartRoute();
        } catch (err) {
          this.errors = err;

          return;
        }
      }

      this.controllerChart.goToInstall('kubewarden');
    }
  }
};
</script>

<template>
  <div class="container">
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
          <button
            class="btn role-primary mt-20"
            :disabled="!installReady"
            @click.prevent="chartRoute"
          >
            {{ t("kubewarden.dashboard.appInstall.button") }}
          </button>
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
}
</style>
