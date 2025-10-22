<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';
import { ref } from 'vue';

import { CATALOG } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import ResourceFetch from '@shell/mixins/resource-fetch';

import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import { SBOMSCANNER, SBOMSCANNER_REPOS, CNPG, CNPG_REPOS } from '@pkg/types';
import { handleGrowl } from '@pkg/utils/handle-growl';
import { refreshCharts, getLatestVersion } from '@pkg/utils/chart';
import InstallWizard from '@pkg/components/common/InstallWizard';

export default {

  components: {
    AsyncButton,
    Banner,
    InstallWizard,
    Loading,
  },

  mixins: [ResourceFetch],

  async fetch() {
    this.debouncedRefreshCharts = debounce((init = false) => {
      refreshCharts({
        store:     this.$store,
        chartName: SBOMSCANNER_REPOS.CHARTS_REPO_NAME,
        init
      });
      refreshCharts({
        store:     this.$store,
        chartName: CNPG_REPOS.CHARTS_REPO_NAME,
        init
      });
    }, 500);

    await this.load();
  },

  data() {
    const installSteps = ref([
      {
        name:  'repository4Cnpg',
        label: 'CNPG Repo',
        ready: false,
      },
      {
        name:  'repository4Sbomscanner',
        label: 'Sbomscanner Repo',
        ready: false,
      },
      {
        name:  'install',
        label: 'App Install',
        ready: false,
      },
    ]);

    return {
      installSteps,
      debouncedRefreshCharts: null,
      reloadReady:            false,
      install:                false,
      initStepIndex:          0,
      isSkipped:              false,
      maxStepNum:                1,
    };
  },

  watch: {
    combinedWacthedValues: {
      async handler([newCnpgRepo, newSbomscannerRepo], [oldCnpgRepo, oldSbomscannerRepo]) {
        let stepNum = 1;

        await this.$nextTick();
        if (newCnpgRepo !== oldCnpgRepo || newSbomscannerRepo !== oldSbomscannerRepo) {
          if (newCnpgRepo && newSbomscannerRepo) {
            stepNum = 3;
          } else if (newCnpgRepo) {
            stepNum = 2;
          } else {
            stepNum = 1;
          }
          this.maxStepNum = Math.max(stepNum, this.maxStepNum);
          this.$refs.wizard?.goToStep(this.maxStepNum, true);
        }
      },
      deep: true,
    },
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({
      charts: 'catalog/charts',
      repos:  'catalog/repos',
      t:      'i18n/t'
    }),

    /**
     * [!IMPORTANT]
     * TODO:
     * THIS IS BROKEN
     * When installing, if you add the repo and leave the page
     * then come back, the controllerChart will be null, but so will
     * the sbomscannerRepo. This is because the repo is not saved to the store?
     */
    combinedWacthedValues() {
      return [this.cnpgRepo, this.sbomscannerRepo];
    },

    controllerChart4Sbomscanner() {
      if (this.sbomscannerRepo) {
        return this.$store.getters['catalog/chart']({
          repoName:  this.sbomscannerRepo.id,
          repoType:  'cluster',
          chartName: SBOMSCANNER.CONTROLLER
        });
      }

      return null;
    },

    controllerChart4Cnpg() {
      if (this.cnpgRepo) {
        return this.$store.getters['catalog/chart']({
          repoName:  this.cnpgRepo.id,
          repoType:  'cluster',
          chartName: CNPG.CHART_NAME
        });
      }

      return null;
    },

    sbomscannerRepo() {
      const chart = this.charts?.find((chart) => chart.chartName === SBOMSCANNER.CONTROLLER);

      console.log('sbomscannerRepo', this.repos?.find((repo) => repo.id === chart?.repoName));

      return this.repos?.find((repo) => repo.id === chart?.repoName);
    },

    cnpgRepo() {
      const chart = this.charts?.find((chart) => chart.chartName === CNPG.CONTROLLER);

      console.log('cnpgRepo', this.repos?.find((repo) => repo.id === chart?.repoName));

      return this.repos?.find((repo) => repo.id === chart?.repoName);
    },

    hasSbomscannerSchema() {
      return this.$store.getters['cluster/schemaFor'](SBOMSCANNER.SCHEMA);
    },

    hasCnpgSchema() {
      return this.$store.getters['cluster/schemaFor'](CNPG.SCHEMA);
    }
  },

  methods: {
    async load() {
      this.reloadReady = false;

      if (this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO)) {
        await this.$fetchType(CATALOG.CLUSTER_REPO);
      }

      if (this.cnpgRepo) {
        setTimeout(() => {
          this.installSteps[1].ready = true;
          this.$refs.wizard?.goToStep(2, true);
        }, 500);
      }

      if (this.sbomscannerRepo) {
        setTimeout(() => {
          this.installSteps[2].ready = true;
          this.$refs.wizard?.goToStep(3, true);
        }, 500);
      }

      if (!this.sbomscannerRepo || !this.controllerChart4Sbomscanner) {
        this.debouncedRefreshCharts(true);
      }
    },

    async addRepository4Cnpg(btnCb) {
      this.isSkipped = false;
      if (this.cnpgRepo) {
        this.installSteps[0].ready = true;
        this.$refs.wizard?.goToStep(2);

        return;
      }
      try {
        const cnpgRepoObj = await this.$store.dispatch('cluster/create', {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: CNPG_REPOS.CHARTS_REPO_NAME },
          spec:     { url: CNPG_REPOS.CHARTS_REPO },
        });

        try {
          await cnpgRepoObj.save();
        } catch (e) {
          handleGrowl({
            error: e,
            store: this.$store
          });
          if (btnCb) {
            btnCb(false);
          }

          return;
        }
        if (!this.controllerChart4Cnpg) {
          this.debouncedRefreshCharts();
        }
      } catch (e) {
        handleGrowl({
          error: e,
          store: this.$store
        });
        if (btnCb) {
          btnCb(false);
        }
      }
    },

    async addRepository4Sbomscanner(btnCb) {
      if (this.sbomscannerRepo) {
        this.installSteps[1].ready = true;
        this.$refs.wizard?.goToStep(3);

        return;
      }
      try {
        const sbomscannerRepoObj = await this.$store.dispatch('cluster/create', {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: SBOMSCANNER_REPOS.CHARTS_REPO_NAME },
          spec:     { url: SBOMSCANNER_REPOS.CHARTS_REPO },
        });

        try {
          await sbomscannerRepoObj.save();
        } catch (e) {
          handleGrowl({
            error: e,
            store: this.$store
          });
          if (btnCb) {
            btnCb(false);
          }

          return;
        }
        if (!this.controllerChart4Sbomscanner) {
          this.debouncedRefreshCharts();
        }
      } catch (e) {
        handleGrowl({
          error: e,
          store: this.$store
        });
        if (btnCb) {
          btnCb(false);
        }
      }
    },

    skip() {
      this.isSkipped = true;
      this.installSteps[0].ready = true;
      this.$refs.wizard?.goToStep(1);
    },

    previous() {
      this.isSkipped = false;
      this.installSteps[0].ready = false;
      this.$refs.wizard?.goToStep(1);
    },

    chartRoute() {
      if (!this.controllerChart4Sbomscanner && !this.controllerChart4Cnpg) {
        try {
          this.debouncedRefreshCharts();
        } catch (e) {
          handleGrowl({
            error: e,
            store: this.$store
          });

          return;
        }
      }
      if (!this.hasCnpgSchema && !this.isSkipped) {
        try {
          const {
            repoType, repoName, chartName, versions
          } = this.controllerChart4Cnpg;

          const latestChartVersion = getLatestVersion(this.$store, versions);

          if (latestChartVersion) {
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
              _statusText: this.t('imageScanner.dashboard.appInstall.versionError.title'),
              message:     this.t('imageScanner.dashboard.appInstall.versionError.message')
            };

            handleGrowl({
              error,
              store: this.$store
            });
          }
        } catch (error) {
          this.installSteps[0].ready = false;
          this.$refs.wizard?.goToStep(1);
        }
      } else if (!this.hasSbomscannerSchema) {
        const {
          repoType, repoName, chartName, versions
        } = this.controllerChart4Sbomscanner;

        const latestChartVersion = getLatestVersion(this.$store, versions);

        if (latestChartVersion) {
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
            _statusText: this.t('imageScanner.dashboard.appInstall.versionError.title'),
            message:     this.t('imageScanner.dashboard.appInstall.versionError.message')
          };

          handleGrowl({
            error,
            store: this.$store
          });
        }
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
  <div
    v-else
    class="container"
  >
    <div
      v-if="!install && !cnpgRepo && !sbomscannerRepo"
      class="title p-10"
    >
      <div class="logo mt-20 mb-10">
        <img
          src="../assets/img/icon-kubewarden.svg"
          height="64"
        />
      </div>
      <h1
        class="mb-20"
        data-testid="sb-install-title"
      >
        {{ t("imageScanner.dashboard.appInstall.title") }}
      </h1>
      <div class="description">
        {{ t("imageScanner.dashboard.appInstall.description") }}
      </div>
      <button
        class="btn role-primary mt-20"
        data-testid="sb-initial-install-button"
        @click="install = true"
      >
        {{ t("imageScanner.dashboard.appInstall.button4Entry") }}
      </button>
    </div>

    <div
      v-else
    >
      <!-- Non Air-Gapped -->
      <template style="display: flex">
        <InstallWizard
          ref="wizard"
          :init-step-index="initStepIndex"
          :steps="installSteps"
          data-testid="sb-install-wizard"
          style="width: 100%;"
        >
          <template #repository4Cnpg>
            <h2
              class="mt-20 mb-10"
              data-testid="sb-repo-title"
            >
              {{ t("imageScanner.installationWizard.repo4Cnpg.title") }}
            </h2>
            <p class="mb-20">
              {{ t("imageScanner.installationWizard.repo4Cnpg.description") }}
            </p>
            <AsyncButton
              mode="cnpgRepository"
              data-testid="sb-repo-add-button"
              @click="addRepository4Cnpg"
            />
            <button
              class="btn role-secondary"
              style="margin-top: 16px;"
              @click="skip"
            >
              {{ t("imageScanner.installationWizard.button.skipToSbomscannerRepo") }}
            </button>
          </template>

          <template #repository4Sbomscanner>
            <h2
              class="mt-20 mb-10"
              data-testid="sb-repo-title"
            >
              {{ t("imageScanner.installationWizard.repo4Sbomscanner.title") }}
            </h2>
            <p class="mb-20">
              {{ t("imageScanner.installationWizard.repo4Sbomscanner.description") }}
            </p>
            <div style="display: flex; align-items: center; gap: 24px;">
              <button
                class="btn role-secondary"
                @click="previous"
              >
                {{ t("imageScanner.installationWizard.button.previous") }}
              </button>
              <AsyncButton
                mode="sbomscannerRepository"
                data-testid="sb-repo-add-button"
                @click="addRepository4Sbomscanner"
              />
            </div>
          </template>

          <template #install>
            <div v-if="!hasCnpgSchema && !isSkipped">
              <h2
                class="mt-20 mb-10"
                data-testid="sb-app-install-title"
              >
                {{ t("imageScanner.installationWizard.install4Cnpg.title") }}
              </h2>
              <p class="mb-20">
                {{ t("imageScanner.installationWizard.install4Cnpg.description") }}
              </p>
            </div>
            <div v-else-if="!hasSbomscannerSchema">
              <h2
                class="mt-20 mb-10"
                data-testid="sb-app-install-title"
              >
                {{ t("imageScanner.installationWizard.install4Sbomscanner.title") }}
              </h2>
              <p class="mb-20">
                {{ t("imageScanner.installationWizard.install4Sbomscanner.description") }}
              </p>
            </div>

            <div class="chart-route">
              <Loading
                v-if="!controllerChart4Cnpg && !controllerChart4Sbomscanner && !reloadReady"
                mode="relative"
                class="mt-20"
              />

              <template v-else-if="!controllerChart4Cnpg && !controllerChart4Sbomscanner && reloadReady">
                <Banner color="warning">
                  <span class="mb-20">
                    {{ t('imageScanner.dashboard.appInstall.reload' ) }}
                  </span>
                  <button
                    data-testid="sb-app-install-reload"
                    class="ml-10 btn btn-sm role-primary"
                    @click="reload()"
                  >
                    {{ t('generic.reload') }}
                  </button>
                </Banner>
              </template>

              <template v-else>
                <button
                  v-if="!hasCnpgSchema && !isSkipped"
                  data-testid="sb-app-install-button"
                  class="btn role-primary mt-20"
                  :disabled="!controllerChart4Cnpg"
                  @click.prevent="chartRoute"
                >
                  {{ t("imageScanner.dashboard.appInstall.button4Cnpg") }}
                </button>
                <button
                  v-else-if="!hasSbomscannerSchema"
                  data-testid="sb-app-install-button"
                  class="btn role-primary mt-20"
                  :disabled="!controllerChart4Sbomscanner"
                  @click.prevent="chartRoute"
                >
                  {{ t("imageScanner.dashboard.appInstall.button4Sbomscanner") }}
                </button>
              </template>
            </div>
          </template>
        </InstallWizard>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  width: 100%;
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
