<script>
import { mapGetters } from 'vuex';
import { CATALOG } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';

import ResourceFetch from '@shell/mixins/resource-fetch';

import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';

import { POLICY_REPORTER_CHART, POLICY_REPORTER_REPO } from '../../types';
import { getLatestStableVersion } from '../../plugins/kubewarden-class';
import { handleGrowl } from '../../utils/handle-growl';

import InstallWizard from '../InstallWizard';

export default {
  components: {
    InstallWizard, Loading, AsyncButton
  },

  mixins: [ResourceFetch],

  async fetch() {
    await this.$fetchType(CATALOG.CLUSTER_REPO);
    await this.refreshCharts(1, true);
  },

  data() {
    const installSteps = [
      {
        name:  'repo',
        label: 'Policy Reporter Repository',
        ready: false,
      },
      {
        name:  'chart',
        label: 'Chart Install',
        ready: false,
      },
    ];

    return {
      installSteps,
      initStepIndex: 0,
      reloadReady:   false
    };
  },

  beforeUpdate() {
    if ( this.reporterChart ) {
      this.installSteps[0].ready = true;

      this.$nextTick(() => {
        this.$refs.wizard?.goToStep(2);
      });
    }
  },

  watch: {
    reporterChart() {
      this.installSteps[0].ready = true;
      this.$refs.wizard?.goToStep(2);
    }
  },

  computed: {
    ...mapGetters({ allRepos: 'catalog/repos', rawCharts: 'catalog/rawCharts' }),

    isAirgap() {
      // return this.$store.getters['kubewarden/airGapped'];
      return false; // Returning false until we have a method of installing this while air-gapped
    },

    reporterChart() {
      const chartValues = Object.values(this.rawCharts);

      return chartValues.find(c => c.chartName === POLICY_REPORTER_CHART);
    },

    reporterRepo() {
      if ( !this.isAirgap ) {
        return this.allRepos?.find(r => r.spec.url === POLICY_REPORTER_REPO);
      }

      return this.reporterChart;
    }
  },

  methods: {
    async addRepository(btnCb) {
      try {
        const repoObj = await this.$store.dispatch('cluster/create', {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: 'policy-reporter-charts' },
          spec:     { url: POLICY_REPORTER_REPO },
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

    async installChart() {
      if ( !this.reporterChart ) {
        try {
          await this.refreshCharts();
        } catch (e) {
          handleGrowl({ error: e, store: this.$store });

          return;
        }
      }

      const {
        repoType, repoName, chartName, versions
      } = this.reporterChart;
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

    async refreshCharts(retry = 0, init) {
      try {
        await this.$store.dispatch('catalog/load', { force: true, reset: true });
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
      }

      if ( !this.reporterChart && retry === 0 ) {
        await this.$fetchType(CATALOG.CLUSTER_REPO);
        await this.refreshCharts(retry + 1);
      }

      if ( !this.reporterChart && retry === 1 && !init ) {
        this.reloadReady = true;
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

  <div v-else>
    <!-- Air-Gapped -->
    <template v-if="isAirgap">
      <InstallWizard ref="wizard" :init-step-index="initStepIndex" :steps="installSteps" :show-title="false">
        <Banner
          class="mb-20 mt-20"
          color="warning"
        >
          <span data-testid="kw-pr-install-ag-warning">{{ t('kubewarden.policyReporter.install.airGapped.warning') }}</span>
        </Banner>
      </InstallWizard>
    </template>

    <!-- Non Air-Gapped -->
    <template v-else>
      <InstallWizard ref="wizard" :init-step-index="initStepIndex" :steps="installSteps" :show-title="false">
        <template #repo>
          <div class="step-container">
            <h3 class="mt-20 mb-10" data-testid="kw-pr-install-repo-title">
              {{ t("kubewarden.policyReporter.install.repo.title") }}
            </h3>
            <p class="mb-20">
              {{ t("kubewarden.policyReporter.install.repo.description") }}
            </p>

            <AsyncButton mode="policyReporterRepo" data-testid="kw-pr-install-repo-add-button" @click="addRepository" />
          </div>
        </template>

        <template #chart>
          <Loading v-if="!reporterChart && !reloadReady" mode="relative" class="mt-20" />

          <template v-else-if="!reporterChart && reloadReady">
            <Banner color="warning">
              <span class="mb-20">
                {{ t('kubewarden.dashboard.appInstall.reload' ) }}
              </span>
              <button data-testid="kw-pr-install-repo-reload" class="ml-10 btn btn-sm role-primary" @click="reload()">
                {{ t('generic.reload') }}
              </button>
            </Banner>
          </template>

          <template v-else>
            <div>
              <h3 class="mt-20 mb-10" data-testid="kw-pr-install-repo-title">
                {{ t("kubewarden.policyReporter.install.chart.title") }}
              </h3>
              <AsyncButton mode="policyReporterChart" data-testid="kw-pr-install-chart-button" @click="installChart" />
            </div>
          </template>
        </template>
      </InstallWizard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.step-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>