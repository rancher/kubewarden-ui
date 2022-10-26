<script>
import { mapGetters } from 'vuex';

import { CATALOG, SERVICE } from '@shell/config/types';

import AsyncButton from '@shell/components/AsyncButton';
import CopyCode from '@shell/components/CopyCode';
import Loading from '@shell/components/Loading';

import { KUBEWARDEN } from '../../../../types';
// import { updateWhitelist } from '../../../../plugins/kubewarden/policy-class';

import InstallWizard from '../../../../components/overview/InstallWizard';

const KUBEWARDEN_REPO = 'https://charts.kubewarden.io';

export default {
  name: 'Dashboard',

  components: {
    AsyncButton,
    CopyCode,
    InstallWizard,
    Loading,
  },

  async fetch() {
    this.hasSchema = this.$store.getters['cluster/schemaFor'](KUBEWARDEN.POLICY_SERVER);

    // await this.updateWhitelist('github.com');

    const certService = this.allServices?.find(s => s.id === 'cert-manager/cert-manager');

    if ( certService ) {
      this.initStepIndex = 1;
      this.installSteps[0].ready = true;
    }

    const allRepos = await this.$store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO });

    this.kubewardenRepo = allRepos?.find(r => r.spec.url === KUBEWARDEN_REPO);

    if ( this.kubewardenRepo ) {
      certService ? this.initStepIndex = 2 : this.initStepIndex = 0;
      this.installSteps[1].ready = true;
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
      errors: [],

      allRepos:        null,
      controllerChart: null,
      kubewardenRepo:  null,
      hasSchema:       null,

      initStepIndex:   0,
      install:         false,
      installSteps,
    };
  },

  watch: {
    allServices(neu) {
      if ( neu.find(s => s.id === 'cert-manager/cert-manager') ) {
        this.installSteps[0].ready = true;

        if ( this.kubewardenRepo ) {
          this.$refs.wizard.goToStep(3);
        } else {
          this.$refs.wizard.goToStep(2);
        }
      }
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),

    allServices() {
      return this.$store.getters['cluster/all'](SERVICE);
    }
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

        if ( this.kubewardenRepo ) {
          this.$refs.wizard.goToStep(3);
        } else {
          this.$refs.wizard.next();
        }
      } catch (err) {
        this.errors = err;
        btnCb(false);
      }
    },

    async addRepository(btnCb) {
      try {
        this.errors = [];

        const repoObj = await this.$store.dispatch('management/create', {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: 'kubewarden-chart' },
          spec:     { url: 'https://charts.kubewarden.io' },
        });

        await repoObj.save();
        // await this.updateWhitelist('artifacthub.io');

        btnCb(true);
        this.installSteps[1].ready = true;
        this.$refs.wizard.next();
      } catch (err) {
        this.errors = err;
        btnCb(false);
      }
    },

    async setChartRoute() {
      await this.$store.dispatch('catalog/load');

      // Check to see that the chart we need are available
      const charts = this.$store.getters['catalog/rawCharts'];
      const chartValues = Object.values(charts);

      const controllerChart = chartValues.find(
        chart => chart.chartName === 'kubewarden-controller'
      );

      if ( controllerChart ) {
        controllerChart.goToInstall('kubewarden');
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="main">
    <div class="container">
      <div v-if="!install" class="title p-10">
        <div class="logo mt-20 mb-10">
          <img
            src="../../../../assets/icon-kubewarden.svg"
            height="64"
          />
        </div>
        <h1 class="mb-20">
          {{ t("kubewarden.title") }}
        </h1>
        <div class="description">
          {{ t("kubewarden.install.description") }}
        </div>
        <button v-if="!hasSchema" class="btn role-primary mt-20" @click="install = true">
          {{ t("kubewarden.install.appInstall.button") }}
        </button>
      </div>

      <InstallWizard v-if="install" ref="wizard" :init-step-index="initStepIndex" :steps="installSteps">
        <template #certmanager>
          <h2 class="mt-20 mb-10">
            {{ t("kubewarden.install.prerequisites.certManager.title") }}
          </h2>
          <p class="mb-20">
            {{ t("kubewarden.install.prerequisites.certManager.description") }}
          </p>

          <!-- Replacing with manual install step for now -->
          <!-- <AsyncButton mode="certManager" @click="applyCertManager" /> -->

          <p v-html="t('kubewarden.install.prerequisites.certManager.manualStep', null, true)"></p>
          <CopyCode class="m-10 p-10">
            {{ t("kubewarden.install.prerequisites.certManager.applyCommand") }}
          </CopyCode>
        </template>

        <template #repository>
          <h2 class="mt-20 mb-10">
            {{ t("kubewarden.install.prerequisites.repository.title") }}
          </h2>
          <p class="mb-20">
            {{ t("kubewarden.install.prerequisites.repository.description") }}
          </p>

          <AsyncButton mode="kubewardenRepository" @click="addRepository" />
        </template>

        <template #install>
          <h2 class="mt-20 mb-10">
            {{ t("kubewarden.install.appInstall.title") }}
          </h2>
          <p class="mb-20">
            {{ t("kubewarden.install.appInstall.description") }}
          </p>
          <button
            class="btn role-primary mt-20"
            @click.prevent="setChartRoute"
          >
            {{ t("kubewarden.install.appInstall.button") }}
          </button>
        </template>
      </InstallWizard>
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
