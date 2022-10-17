<script>
import { mapGetters } from 'vuex';

import { CATALOG, MANAGEMENT, SERVICE } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';

import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';

import InstallWizard from '~/pkg/kubewarden/components/overview/InstallWizard';

const KUBEWARDEN_REPO = 'https://charts.kubewarden.io';

export default {
  name: 'Dashboard',

  components: {
    AsyncButton,
    InstallWizard,
    Loading,
  },

  async fetch() {
    const whitelist = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'whitelist-domain' });

    if ( !whitelist.value.includes('github.com') ) {
      whitelist.default += ',github.com';
      whitelist.value += ',github.com';
      await whitelist.save();
    }

    const certManager = await this.$store.dispatch('cluster/find', { type: SERVICE, id: 'cert-manager/cert-manager' });

    if ( certManager ) {
      this.installSteps[0].ready = true;
      this.initStepIndex = 1;
    }

    this.repoSchema = this.$store.getters['management/schemaFor'](CATALOG.CLUSTER_REPO);

    if ( this.repoSchema ) {
      const allRepos = await this.$store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO });

      if ( allRepos.find(r => r.spec.url === KUBEWARDEN_REPO) ) {
        this.installSteps[1].ready = true;
        this.initStepIndex = 2;
      }
    }

    // Check to see that the charts we need are available
    await this.$store.dispatch('catalog/load');

    const charts = this.$store.getters['catalog/charts'];
    const chartValues = Object.values(charts);

    this.controllerChart = chartValues.find(
      chart => chart.chartName === 'kubewarden-controller'
    );

    if ( this.controllerChart ) {
      this.getStartedLink = {
        name:   'c-cluster-apps-charts-install',
        params: {
          cluster: this.$route.params.cluster,
          product: CATALOG.APP,
        },
        query: {
          [REPO_TYPE]: this.controllerChart.repoType,
          [REPO]:      this.controllerChart.repoName,
          [CHART]:     this.controllerChart.chartName,
          [VERSION]:   this.controllerChart.versions[0].version,
        },
      };
    }
  },

  data() {
    const installSteps = [
      {
        name:  'prerequisites',
        label: 'Prerequisites',
        ready: false,
      },
      {
        name:  'repository',
        label: 'Repository',
        ready: false,
      },
      {
        name:  'install',
        label: 'Install',
        ready: false,
      },
    ];

    return {
      errors:          [],
      controllerChart: null,
      getStartedLink:  null,
      initStepIndex:   0,
      repoSchema:      null,
      installSteps,
    };
  },

  computed: { ...mapGetters(['currentCluster']) },

  methods: {
    async applyCertManager(btnCb) {
      try {
        this.errors = [];

        /*
          fetch cert-manager latest release and apply
        */
        const url = '/meta/proxy/github.com/cert-manager/cert-manager/releases/download/v1.10.0/cert-manager.yaml';
        const res = await this.$store.dispatch('management/request', { url, headers: { accept: 'application/yaml' } });

        const yaml = res?.data;

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

        const repoObj = {
          metadata: { name: 'kubewarden-chart' },
          spec:     { url: 'https://charts.kubewarden.io', clientSecret: null },
          type:     CATALOG.CLUSTER_REPO
        };

        await this.repoSchema.doAction('install', repoObj);

        btnCb(true);

        this.installSteps[1].ready = true;
        this.$refs.wizard.next();
      } catch (err) {
        this.errors = err;
        btnCb(false);
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="main">
    <div class="container">
      <div class="title p-10">
        <div class="logo mt-20 mb-20">
          <img
            src="https://www.kubewarden.io/images/logo-kubewarden.svg"
            height="64"
          />
        </div>
        <div class="description">
          {{ t("kubewarden.install.description") }}
        </div>
      </div>

      <InstallWizard ref="wizard" :init-step-index="initStepIndex" :steps="installSteps">
        <template #prerequisites>
          <h2 class="mb-10">
            {{ t("kubewarden.install.prerequisites.certManager.title") }}
          </h2>
          <p class="mb-20">
            {{ t('kubewarden.install.prerequisites.certManager.description') }}
          </p>

          <AsyncButton mode="certManager" @click="applyCertManager" />
        </template>

        <template #repository>
          <h2 class="mb-10">
            {{ t("kubewarden.install.prerequisites.repository.title") }}
          </h2>
          <p class="mb-20">
            {{ t('kubewarden.install.prerequisites.repository.description') }}
          </p>

          <AsyncButton mode="kubewardenRepository" @click="addRepository" />
        </template>

        <template #install>
          <nuxt-link
            :to="getStartedLink"
            class="btn role-secondary mt-20"
          >
            {{ t('kubewarden.install.getStarted') }}
          </nuxt-link>
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
