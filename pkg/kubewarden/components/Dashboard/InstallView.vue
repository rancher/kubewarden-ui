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
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { AUTH_TYPE, SECRET, NAMESPACE } from '@shell/config/types';

import { KUBEWARDEN_CHARTS, KUBEWARDEN_REPOS } from '@kubewarden/types';
import { getLatestVersion } from '@kubewarden/plugins/kubewarden-class';
import { handleGrowl } from '@kubewarden/utils/handle-growl';
import { refreshCharts } from '@kubewarden/utils/chart';
import FileSelector from '@shell/components/form/FileSelector';

import InstallWizard from '@kubewarden/components/InstallWizard';

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
    Checkbox,
    InstallWizard,
    LabeledInput,
    Loading,
    Markdown,
    NameNsDescription,
    SelectOrCreateAuthSecret,
    FileSelector
  },

  mixins: [ResourceFetch],

  async fetch() {
    this.debouncedRefreshCharts = debounce((init = false) => {
      refreshCharts({
        store:     this.$store,
        chartName: KUBEWARDEN_CHARTS.CHART,
        init
      });
    }, 500);

    this.reloadReady = false;

    if (this.$store.getters['cluster/canList'](SECRET)) {
      await this.$fetchType(SECRET);
      this.allSecrets = this.$store.getters['cluster/all'](SECRET) || [];
    }

    if (!this.hasSchema) {
      if (this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO)) {
        await this.$fetchType(CATALOG.CLUSTER_REPO);
      }

      if (this.controllerChart) {
        this.initStepIndex = 2;
        this.installSteps[0].ready = true;
        this.installSteps[1].ready = true;
      }

      if (!this.kubewardenRepo || !this.controllerChart) {
        this.debouncedRefreshCharts(true);
      }
    }
  },

  data() {
    const installSteps = [
      {
        name:  'globalRepoAuth',
        label: 'Repository Auth',
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
      installSteps,
      debouncedRefreshCharts:       null,
      reloadReady:                  false,
      install:                      false,
      initStepIndex:                0,
      docs:                         { airgap: '' },
      appcoAuthSecret:              null,
      appcoNamespace:               'kubewarden-system',
      appcoCaBundle:                '',
      appcoInsecurePlainHttp:       false,
      appcoInsecureSkipTLSVerify:   false,
      allSecrets:                   [],
      repoNamespace:                'kubewarden-system',
      secretCreateHook:             null,
      duplicatedImagePullSecretKey: null,
    };
  },

  async mounted() {
    if (this.isAirgap) {
      const docs = (await import(/* webpackChunkName: "airgap-docs" */ '../../assets/airgap-installation.md'));

      if (docs) {
        this.docs.airgap = docs.body;
      }
    }
  },

  watch: {
    controllerChart() {
      this.installSteps[0].ready = true;
      this.installSteps[1].ready = true;

      this.$refs.wizard?.goToStep(3);
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({
      charts: 'catalog/charts',
      repos:  'catalog/repos',
      t:      'i18n/t'
    }),

    isAirgap() {
      return this.$store.getters['kubewarden/airGapped'];
    },

    controllerChart() {
      if (this.kubewardenRepo) {
        return this.$store.getters['catalog/chart']({
          repoName:  this.kubewardenRepo.id,
          repoType:  'cluster',
          chartName: KUBEWARDEN_CHARTS.CONTROLLER
        });
      }

      return null;
    },

    kubewardenRepo() {
      const chart = this.charts?.find((chart) => chart.chartName === KUBEWARDEN_CHARTS.CONTROLLER);

      return this.repos?.find((repo) => repo.id === chart?.repoName);
    },

    shellEnabled() {
      return !!this.currentCluster?.links?.shell;
    },

    imagePullSecretAuthType() {
      return AUTH_TYPE._BASIC;
    },

    appcoNamespaceValue() {
      return { metadata: { namespace: this.appcoNamespace } };
    }
  },

  methods: {
    registerBeforeHook(hookFunction, hookName, hookPriority) {
      this.secretCreateHook = hookFunction;
      this.secretCreateHookName = hookName;
      this.secretCreateHookPriority = hookPriority;
    },

    async continueWithGlobalRepoAuth() {
      if (!this.appcoAuthSecret && this.secretCreateHook) {
        await this.secretCreateHook();
      }

      this.installSteps[0].ready = true;
      this.$refs.wizard?.goToStep(2);
    },

    getSecretKey(secret) {
      const name = secret?.metadata?.name;
      const namespace = secret?.metadata?.namespace || 'default';

      if (!name) {
        return '';
      }

      return `${ namespace }/${ name }`;
    },

    findAuthSecretByName(secretName) {
      if (!secretName) {
        return null;
      }

      return this.allSecrets?.find((secret) => secret?.metadata?.name === secretName) || null;
    },

    isAlreadyExistsError(error) {
      return error?.status === 409 || error?.code === 409 || `${ error?.message || '' }`.toLowerCase().includes('already exists');
    },

    buildDockerConfigJson(secret) {
      if (secret?.data?.['.dockerconfigjson']) {
        return { data: { '.dockerconfigjson': secret.data['.dockerconfigjson'] } };
      }

      if (secret?.stringData?.['.dockerconfigjson']) {
        return { stringData: { '.dockerconfigjson': secret.stringData['.dockerconfigjson'] } };
      }

      const decodeBase64 = (value) => {
        try {
          return value ? atob(value) : '';
        } catch {
          return value || '';
        }
      };

      const username = decodeBase64(secret?.data?.username) || secret?.stringData?.username || '';
      const password = decodeBase64(secret?.data?.password) || secret?.stringData?.password || '';

      const registryUrl = 'oci://dp.apps.rancher.io/charts';
      const registryHost = registryUrl ? (() => {
        try {
          return new URL(registryUrl).host;
        } catch {
          return registryUrl;
        }
      })() : '';

      const config = {
        auths: {
          [registryHost]: {
            username,
            password,
            auth: btoa(`${ username }:${ password }`),
          }
        }
      };

      return { data: { '.dockerconfigjson': btoa(JSON.stringify(config)) } };
    },

    sanitizeSecretForCreate(secret, namespace) {
      const { data, stringData } = this.buildDockerConfigJson(secret);

      return {
        type:      SECRET,
        _type:     'kubernetes.io/dockerconfigjson',
        metadata:  {
          name: secret?.metadata?.name,
          namespace,
        },
        data,
        stringData,
        immutable: secret?.immutable,
      };
    },

    sanitizeImagePullSecretForCreate(secret, namespace) {
      const { data, stringData } = this.buildDockerConfigJson(secret);

      return {
        type:      SECRET,
        _type:     'kubernetes.io/dockerconfigjson',
        metadata:  {
          name: `${ secret?.metadata?.name || 'kw' }-image-pull-secret`,
          namespace,
        },
        data,
        stringData,
        immutable: secret?.immutable,
      };
    },

    resolveNamespace(namespace) {
      return `${ namespace || '' }`.trim() || 'default';
    },

    async ensureNamespace(namespace) {
      const targetNamespace = this.resolveNamespace(namespace);

      const namespaceResource = await this.$store.dispatch('cluster/create', {
        type:     NAMESPACE,
        metadata: { name: targetNamespace },
      });

      try {
        await namespaceResource.save();
      } catch (error) {
        if (!this.isAlreadyExistsError(error)) {
          throw error;
        }
      }
    },

    async duplicateAuthSecret(secret, namespace) {
      if (!secret?.metadata?.name) {
        return;
      }

      const secretKey = this.getSecretKey(secret);
      const targetNamespace = this.resolveNamespace(namespace);
      const duplicationKey = `${ secretKey }->${ targetNamespace }`;

      if (this.duplicatedAuthSecretKey === duplicationKey) {
        return;
      }

      const duplicatedSecret = await this.$store.dispatch('cluster/create', this.sanitizeSecretForCreate(secret, targetNamespace));

      try {
        await duplicatedSecret.save();
      } catch (error) {
        if (!this.isAlreadyExistsError(error)) {
          throw error;
        }
      }

      this.duplicatedAuthSecretKey = duplicationKey;
    },

    async duplicateImagePullSecret(secret, namespace) {
      if (!secret?.metadata?.name) {
        return;
      }

      const secretKey = this.getSecretKey(secret);
      const targetNamespace = this.resolveNamespace(namespace);
      const duplicationKey = `${ secretKey }->${ targetNamespace }-image-pull-secret`;

      if (this.duplicatedImagePullSecretKey === duplicationKey) {
        return;
      }

      const duplicatedSecret = await this.$store.dispatch('cluster/create', this.sanitizeImagePullSecretForCreate(secret, targetNamespace));

      try {
        await duplicatedSecret.save();
      } catch (error) {
        if (!this.isAlreadyExistsError(error)) {
          throw error;
        }
      }

      this.duplicatedImagePullSecretKey = duplicationKey;
    },

    getAuthSecretName(authSecret) {
      if (!authSecret) {
        return '';
      }

      if (typeof authSecret === 'string') {
        return authSecret;
      }

      return authSecret?.metadata?.name || authSecret?.name || '';
    },

    getAuthSecretNamespace(authSecret) {
      if (!authSecret) {
        return '';
      }

      if (typeof authSecret !== 'string') {
        return authSecret?.metadata?.namespace || authSecret?.namespace || 'default';
      }

      const selectedSecret = this.findAuthSecretByName(authSecret);

      return selectedSecret?.metadata?.namespace || 'default';
    },

    getAuthSecretRef(authSecret) {
      const name = this.getAuthSecretName(authSecret);

      if (!name) {
        return null;
      }

      return {
        name,
        namespace: this.getAuthSecretNamespace(authSecret),
      };
    },

    async ensureAuthSecret(namespace = 'default') {
      if (this.appcoAuthSecret) {
        const secretName = this.getAuthSecretName(this.appcoAuthSecret);
        const selectedSecret = this.findAuthSecretByName(secretName);

        if (selectedSecret) {
          await this.duplicateAuthSecret(selectedSecret, namespace);

          return this.getAuthSecretRef(selectedSecret);
        }

        return this.getAuthSecretRef(this.appcoAuthSecret);
      }

      if (!this.secretCreateHook) {
        return null;
      }

      const secret = await this.secretCreateHook();

      await this.duplicateAuthSecret(secret, namespace);

      this.appcoAuthSecret = secret;

      return this.getAuthSecretRef(secret);
    },

    async addRepository(btnCb) {
      try {
        const targetNamespace = this.resolveNamespace(this.appcoNamespace);

        await this.ensureNamespace(targetNamespace);

        const authSecretRef = await this.ensureAuthSecret(targetNamespace);
        const authSecret = this.appcoAuthSecret || this.findAuthSecretByName(authSecretRef?.name);

        await this.duplicateImagePullSecret(authSecret, targetNamespace);
        const repoObj = await this.$store.dispatch('cluster/create', {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: KUBEWARDEN_REPOS.CHARTS_REPO_NAME },
          spec:     {
            url:                   KUBEWARDEN_REPOS.SUSE_SECURITY_ADMISSION_CONTROLLER,
            clientSecret:          authSecretRef,
            caBundle:              this.appcoCaBundle || undefined,
            insecurePlainHttp:     this.appcoInsecurePlainHttp,
            insecureSkipTLSVerify: this.appcoInsecureSkipTLSVerify,
          },
        });

        try {
          await repoObj.save();
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

        if (!this.controllerChart) {
          this.debouncedRefreshCharts(true);
        }

        if (btnCb) {
          btnCb(true);
        }

        this.installSteps[1].ready = true;
        this.$refs.wizard?.goToStep(3);
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

    chartRoute() {
      if (!this.controllerChart) {
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

      const {
        repoType, repoName, chartName, versions
      } = this.controllerChart;

      const latestChartVersion = getLatestVersion(this.$store, versions);

      if (latestChartVersion) {
        const query = {
          [REPO_TYPE]: repoType,
          [REPO]:      repoName,
          [CHART]:     chartName,
          [VERSION]:   latestChartVersion,
          [NAMESPACE]: this.appcoNamespace,
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

        handleGrowl({
          error,
          store: this.$store
        });
      }
    },

    reload() {
      this.$router.go();
    },

    onFileSelected(value) {
      this.appcoCaBundle = value;
    },
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
        <InstallWizard ref="wizard" style="width: 100%;" :init-step-index="initStepIndex" :steps="installSteps" data-testid="kw-install-wizard">
          <template #globalRepoAuth>
            <h2 class="mt-20 mb-10" data-testid="kw-repo-auth-title">
              {{ t('kubewarden.dashboard.appInstall.auth.title') }}
            </h2>
            <p class="mb-20">
              {{ t('kubewarden.dashboard.appInstall.auth.description') }}
            </p>
            <SelectOrCreateAuthSecret
              class="mt-16 create-secret-banner"
              v-model:value="appcoAuthSecret"
              :mode="'create'"
              data-testid="kw-appco-auth-secret"
              :register-before-hook="registerBeforeHook"
              :namespace="'default'"
              :pre-select="{ selected: imagePullSecretAuthType }"
              :limit-to-namespace="false"
              :in-store="'cluster'"
              :allow-ssh="false"
              :allow-none="false"
              :allow-basic="true"
              :generate-name="'appco-auth-'"
              :cache-secrets="true"
              :fixed-http-basic-auth="true"
              :filter-basic-auth="'appco-auth-'"
              @inputauthval="() => {}"
            />

            <div class="ca-bundle-section mt-16">
              <LabeledInput
                  v-model:value="appcoCaBundle"
                  type="multiline"
                  :label="t('kubewarden.dashboard.appInstall.auth.caBundle.label')"
                  style="max-height: 110px; overflow-y: auto;"
                  :placeholder="t('kubewarden.dashboard.appInstall.auth.caBundle.placeholder')"
              />
              <div class="mt-16">
                <FileSelector class="btn btn-sm role-tertiary" :label="t('generic.readFromFile')" @selected="onFileSelected" />
              </div>
            </div>

            <div class="row create-secret-banner mb-16 mt-20">
              <Checkbox
                v-model:value="appcoInsecurePlainHttp"
                data-testid="kw-appco-insecure-plain-http"
                label-key="kubewarden.dashboard.appInstall.auth.insecurePlainHttp"
              />
              <Checkbox
                v-model:value="appcoInsecureSkipTLSVerify"
                data-testid="kw-appco-insecure-skip-tls"
                label-key="kubewarden.dashboard.appInstall.auth.insecureSkipTLSVerify"
              />
            </div>

            <div class="namespaces-section mt-20 mb-20">
              <NameNsDescription
                :value="appcoNamespaceValue"
                :mode="'create'"
                data-testid="kw-appco-namespace"
                :name-hidden="true"
                :description-hidden="true"
                @update:value="appcoNamespace = $event?.metadata?.namespace || appcoNamespace"
              />
            </div>

            <button class="btn role-primary mt-20" data-testid="kw-appco-auth-continue" @click="continueWithGlobalRepoAuth">
              {{ t('kubewarden.dashboard.appInstall.auth.continue') }}
            </button>
          </template>

          <template #repository>
            <h2 class="mt-20 mb-10" data-testid="kw-repo-title">
              {{ t('kubewarden.dashboard.appInstall.repository.title') }}
            </h2>
            <p class="mb-20">
              {{ t('kubewarden.dashboard.appInstall.repository.description') }}
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

  /* NameNsDescription keeps narrow span classes internally even when name/description are hidden. */
  :deep([data-testid='kw-appco-namespace'] .row.mb-20 > .col.span-3) {
    flex: 0 0 100%;
    max-width: 100%;
  }

  .create-secret-banner, .ca-bundle-section, .namespaces-section {
    width: 100%
  }

  /* 8-Point Grid Spacing Classes */
  .mt-6 { margin-top: 6px; }
  .mt-8  { margin-top: 8px; }
  .mt-16 { margin-top: 16px; }
  .mt-24 { margin-top: 24px; }
  .mt-32 { margin-top: 32px; }

  .mb-8  { margin-bottom: 8px; }
  .mb-10 { margin-bottom: 10px; }
  .mb-16 { margin-bottom: 16px; }
  .mb-24 { margin-bottom: 24px; }

}
</style>
