<script>
import jsyaml from 'js-yaml';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import merge from 'lodash/merge';
import { toRaw } from 'vue';
import { mapGetters } from 'vuex';

import { _CREATE } from '@shell/config/query-params';
import { CATALOG, MANAGEMENT, NAMESPACE } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import { saferDump } from '@shell/utils/create-yaml';
import { set } from '@shell/utils/object';

import { Banner } from '@components/Banner';

import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import Wizard from '@shell/components/Wizard';

import {
  DEFAULT_POLICY,
  KUBEWARDEN,
  KUBEWARDEN_ANNOTATIONS,
  KUBEWARDEN_CATALOG_ANNOTATIONS,
  KUBEWARDEN_POLICY_ANNOTATIONS,
  KUBEWARDEN_PRODUCT_NAME,
  KUBEWARDEN_REPOS,
  VALUES_STATE
} from '@kubewarden/types';
import { handleGrowl } from '@kubewarden/utils/handle-growl';
import { removeEmptyAttrs } from '@kubewarden/utils/object';
import { trimTrailingSlash } from '@kubewarden/utils/string';

import PolicyReadmePanel from './PolicyReadmePanel';
import PolicyTable from './PolicyTable';
import Values from './Values';

export default ({
  name: 'Create',

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      default:  () => ({})
    },
  },

  components: {
    AsyncButton,
    Banner,
    Loading,
    Wizard,
    PolicyTable,
    PolicyReadmePanel,
    Values
  },

  inject: ['chartType'],

  mixins: [CreateEditView],

  async created() {
    this.isLoading = true;
    const isReposLoaded = this.$store.getters['catalog/repos']?.length > 0;

    if (!isReposLoaded && this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO)) {
      await this.$store.dispatch('cluster/findAll', { type: CATALOG.CLUSTER_REPO });
    }

    const isChartsLoaded = this.$store.getters['catalog/charts']?.length > 0;

    if (!isChartsLoaded) {
      await this.$store.dispatch('catalog/refresh');
    }

    this.value.apiVersion = `${ this.schema?.attributes?.group }.${ this.schema?.attributes?.version }`;
    this.value.kind = this.schema?.attributes?.kind;

    this.isLoading = false;
  },

  data() {
    const OFFICIAL_REPOS = [
      KUBEWARDEN_REPOS.POLICY_CATALOG,
      KUBEWARDEN_REPOS.POLICY_CATALOG_REPO,
      KUBEWARDEN_REPOS.POLICY_CATALOG_REPO_GIT
    ];

    return {
      OFFICIAL_REPOS,

      isLoading:              false,
      bannerTitle:            null,
      shortDescription:       null,
      loadingPackages:        false,
      packages:               null,
      repository:             null,
      selectedPolicyChart:    null,
      selectedPolicyDetails:  null,
      typeModule:             null,
      version:                null,
      errorFetchingPolicy:    false,

      chartValues: {
        policy:    {},
        questions: {}
      },
      yamlValues: '',

      hasCustomPolicy: false,
      yamlOption:      VALUES_STATE.FORM,
      finishAttempts:  0,

      // Steps
      stepPolicies: {
        hidden:    false,
        name:      'policies',
        label:     'Policies',
        ready:     false,
        showSteps: false,
        weight:    99
      },
      stepValues: {
        name:      'values',
        label:     'Values',
        ready:     true,
        showSteps: false,
        weight:    98
      },
    };
  },

  computed: {
    ...mapGetters({
      charts:   'catalog/charts',
      repos:    'catalog/repos',
    }),

    isAirgap() {
      return this.$store.getters['kubewarden/airGapped'];
    },

    isCreate() {
      return this.realMode === _CREATE;
    },

    isSelected() {
      return !!this.selectedPolicyChart;
    },

    customPolicy() {
      return this.selectedPolicyChart === 'custom';
    },

    /** Allow create if either editing in yaml view or module and required rules/settings have been met */
    canFinish() {
      if (this.yamlOption === VALUES_STATE.YAML) {
        return true;
      }

      return !!this.chartValues?.policy?.spec?.module && this.hasRequired;
    },

    systemDefaultRegistry() {
      return this.$store.getters['management/byId'](MANAGEMENT.SETTING, 'system-default-registry');
    },

    /** Determines if the required rules/settings are set, if not the resource can not be created */
    hasRequired() {
      if (!isEmpty(this.chartValues?.policy) && this.chartValues.policy.spec) {
        const { rules, settings } = this.chartValues.policy.spec;

        const requiredRules = ['apiVersions', 'operations', 'resources'];
        const acceptedRules = this.acceptedValues(rules, requiredRules);
        const acceptedName = this.chartValues.policy.metadata.name;

        const requiredQuestions = this.chartValues?.questions?.questions?.map((q) => {
          if (q.required) {
            return q.variable;
          }
        }).filter(Boolean);
        const acceptedQuestions = this.acceptedValues(settings, requiredQuestions);

        if (!!acceptedName && !isEmpty(acceptedRules) && (isEmpty(requiredQuestions) || !isEmpty(acceptedQuestions))) {
          return true;
        }
      }

      return false;
    },

    hideOfficialRepoBanner() {
      return !!this.officialKubewardenRepo || this.$store.getters['kubewarden/hideBannerOfficialRepo'];
    },

    hideRepoBanner() {
      return !this.hideOfficialRepoBanner ||
             (this.policiesCharts.length ||
             this.$store.getters['kubewarden/hideBannerPolicyRepo']);
    },

    hideAirgapBanner() {
      return !this.isAirgap || this.$store.getters['kubewarden/hideBannerAirgapPolicy'];
    },

    steps() {
      const steps = [];

      steps.push(
        this.stepPolicies,
        this.stepValues
      );

      return steps.sort((a, b) => b.weight - a.weight);
    },

    policiesCharts() {
      return this.charts?.filter((chart) => chart.chartType === 'kubewarden-policy');
    },

    latestPolicyChartsVersion() {
      return this.policiesCharts?.map((chart) => {
        const out = chart.versions[0];
        const chartRepo = this.$store.getters['catalog/repo']({
          repoType: out.repoType,
          repoName: out.repoName
        });

        const repoUrl = trimTrailingSlash(chartRepo?.spec?.url || '');

        out.official = this.OFFICIAL_REPOS.includes(repoUrl);

        return out;
      });
    },

    reposByName() {
      return this.repos.reduce((acc, repo) => {
        acc[repo.metadata.name] = repo;

        return acc;
      }, {});
    },

    reposByUrl() {
      return this.repos.reduce((acc, repo) => {
        // For OCI or plain https/http repos, use spec.url. For Git repos, use spec.gitRepo.
        const rawRepoUrl = repo.spec.url || repo.spec.gitRepo;
        const repoUrl = rawRepoUrl ? trimTrailingSlash(rawRepoUrl) : rawRepoUrl;

        if (repoUrl) {
          acc[repoUrl] = repo;
        }

        return acc;
      }, {});
    },

    officialKubewardenRepo() {
      for (const repoUrl of this.OFFICIAL_REPOS) {
        if (this.reposByUrl[repoUrl]) {
          return this.reposByUrl[repoUrl];
        }
      }

      return null;
    }
  },

  methods: {
    async addRepository(btnCb) {
      try {
        const repoObj = await this.$store.dispatch('cluster/create', {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: 'kubewarden-policy-catalog' },
          spec:     { url: KUBEWARDEN_REPOS.POLICY_CATALOG },
        });

        try {
          await repoObj.save();
        } catch (e) {
          handleGrowl({
            error: e,
            store: this.$store
          });
          btnCb(false);

          return;
        }

        if (!this.officialKubewardenRepo) {
          await this.$store.dispatch('catalog/refresh');
        }
      } catch (e) {
        handleGrowl({
          error: e,
          store: this.$store
        });
        btnCb(false);
      }
    },

    /** Determine values which need to be required from supplied property and keys */
    acceptedValues(requiredProp, requiredKeys) {
      if (isEmpty(requiredKeys)) {
        return null;
      }

      let accepted;

      if (Array.isArray(requiredProp)) {
        accepted = requiredProp.find((prop) => this.checkProperties(prop, requiredKeys));
      } else {
        accepted = this.checkProperties(requiredProp, requiredKeys);
      }

      return accepted;
    },

    /** Check supplied property for required keys */
    checkProperties(requiredProp, requiredKeys) {
      const match = [];

      if (!isEmpty(requiredKeys)) {
        for (const key of requiredKeys.values()) {
          if (!isEmpty(requiredProp[key]) || typeof requiredProp[key] === 'boolean' || typeof requiredProp[key] === 'number') {
            match.push(key);
          }
        }
        if (requiredKeys && isEqual(match, requiredKeys)) {
          return requiredProp;
        }
      }

      return null;
    },

    async closeBanner(banner, retry = 0) {
      const res = await this.$store.dispatch(`kubewarden/${ banner }`, true);

      if (retry === 0 && res?.type === 'error' && res?.status === 500) {
        await this.close(retry + 1);
      }
    },

    async createNamespace(ns) {
      const allNamespaces = this.$store.getters['cluster/all'](NAMESPACE);
      const nsTemplate = {
        type:                     NAMESPACE,
        metadata:                 { name: ns },
        disableOpenApiValidation: false
      };

      const existing = allNamespaces?.find((n) => n?.metadata?.name === ns);

      if (!existing) {
        const nsResource = await this.$store.dispatch('cluster/create', nsTemplate);

        try {
          await nsResource.save();
        } catch (e) {
          this.errors.push(e);
        }
      }
    },

    done() {
      this.$router.replace({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  this.$route.params.cluster,
          product:  KUBEWARDEN_PRODUCT_NAME,
          resource: this.schema?.id
        }
      });
    },

    async finish(event) {
      try {
        let out;

        if (this.yamlOption === VALUES_STATE.YAML) {
          out = jsyaml.load(this.yamlValues);
        } else {
          out = this.chartValues?.policy ? this.chartValues.policy : jsyaml.load(this.yamlValues);
        }

        removeEmptyAttrs(out); // Clean up empty values from questions

        if (this.finishAttempts > 0) {
          // Remove keys that are not in the new spec
          Object.keys(this.value.spec).forEach((key) => {
            if (!(key in out.spec)) {
              this.$delete(this.value.spec, key);
            }
          });

          // Then, set or update the remaining keys
          Object.keys(out.spec).forEach((key) => {
            this.value.spec.key = out.spec[key];
          });
        } else {
          merge(this.value, out);
        }

        // If create new namespace option is selected, create the ns before saving the policy
        if (this.chartType === KUBEWARDEN.ADMISSION_POLICY && this.chartValues?.isNamespaceNew) {
          await this.createNamespace(this.value?.metadata?.namespace);
        }

        await this.attemptSave(event);
      } catch (e) {
        console.error('Error creating policy', e);
      }
    },

    async attemptSave(event) {
      await this.save(event);

      // Check for errors set by the mixin
      if (this.errors && this.errors.length > 0) {
        const error = new Error('Save operation failed');

        this.finishAttempts++;
        throw error; // Force an error to be caught in the finish method
      }
    },

    parseObj(obj) {
      if (!obj) {
        return null;
      }

      const parsed = JSON.parse(JSON.stringify(obj));

      return jsyaml.load(parsed);
    },

    /** Extract policy questions from the policy chart's details */
    async policyQuestions() {
      const defaultPolicy = structuredClone(DEFAULT_POLICY);

      if (this.customPolicy) {
        // Add contextAwareResources to custom policy spec
        const updatedCustomPolicy = { spec: { contextAwareResources: [] } };

        const finalPolicy = merge({}, defaultPolicy, updatedCustomPolicy);

        set(this.chartValues, 'policy', finalPolicy);
        this.yamlValues = saferDump(finalPolicy);

        return;
      } else {
        // Add chart metadata annotations for fetching chart details/questions later
        this.value.metadata.annotations = this.value.metadata.annotations || {};
        this.value.metadata.annotations[KUBEWARDEN_ANNOTATIONS.CHART_KEY] = this.selectedPolicyChart.key;
        this.value.metadata.annotations[KUBEWARDEN_ANNOTATIONS.CHART_NAME] = this.selectedPolicyChart.name;
        this.value.metadata.annotations[KUBEWARDEN_ANNOTATIONS.CHART_VERSION] = this.selectedPolicyChart.version;
      }

      try {
        this.selectedPolicyDetails = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType:     this.selectedPolicyChart.repoType,
          repoName:     this.selectedPolicyChart.repoName,
          chartName:    this.selectedPolicyChart.name,
          versionName:  this.selectedPolicyChart.version
        });

        const policyQuestions = this.selectedPolicyDetails?.questions;
        const policyAnnotations = toRaw(this.selectedPolicyDetails?.chart?.annotations);

        if (!policyAnnotations) {
          throw new Error('Policy annotations are missing');
        }

        let registry = policyAnnotations[KUBEWARDEN_CATALOG_ANNOTATIONS.REGISTRY];
        let policyModule = `${ policyAnnotations[KUBEWARDEN_CATALOG_ANNOTATIONS.REPOSITORY] }:${ policyAnnotations[KUBEWARDEN_CATALOG_ANNOTATIONS.TAG] }`;

        // Override annotation by rancher system-default-registry if user changed default value (expected in airgap)
        if (this.systemDefaultRegistry?.value && this.systemDefaultRegistry.value !== this.systemDefaultRegistry.default) {
          registry = this.systemDefaultRegistry.value;
        }

        if (registry) {
          policyModule = `${ registry }/${ policyModule }`;
        }

        const updatedPolicy = {
          apiVersion: this.value.apiVersion,
          kind:       this.value.kind,
          metadata:   { ...this.value.metadata },
          spec:       {
            module:   policyModule,
            mode:     'monitor', // Default to monitor mode
            mutating: policyAnnotations[KUBEWARDEN_CATALOG_ANNOTATIONS.MUTATING] === 'true' || false,
            rules:    this.parseObj(policyAnnotations[KUBEWARDEN_CATALOG_ANNOTATIONS.RULES]) || []
          }
        };

        if (this.chartType === KUBEWARDEN.CLUSTER_ADMISSION_POLICY) {
          Object.assign(updatedPolicy.spec, { contextAwareResources: this.parseObj(policyAnnotations[KUBEWARDEN_CATALOG_ANNOTATIONS.CONTEXT_AWARE_RESOURCES]) || [] });
        }

        merge(defaultPolicy, updatedPolicy);
        set(this.chartValues, 'policy', defaultPolicy);

        this.yamlValues = saferDump(this.chartValues.policy);

        if (policyQuestions) {
          set(this.chartValues, 'questions', policyQuestions);
        }

        this.shortDescription = this.selectedPolicyChart?.description;
      } catch (e) {
        console.warn('Error fetching policy questions. Using default policy scaffold. Details:', e);

        this.errorFetchingPolicy = true;

        this.bannerTitle = 'Policy Details Unavailable';
        this.shortDescription = `There was an issue retrieving the policy details. The default configuration will be used. (Error: ${ e.message || 'Unknown error' })`;

        // Fallback: use the default policy scaffold without additional questions
        set(this.chartValues, 'policy', defaultPolicy);
        this.yamlValues = saferDump(defaultPolicy);
      }
    },

    reset(event) {
      this.$nextTick(() => {
        if (event.step?.name === this.stepPolicies.name) {
          const initialState = [
            'errors',
            'bannerTitle',
            'shortDescription',
            'selectedPolicyChart',
            'selectedPolicyDetails',
            'typeModule',
            'version',
            'hasCustomPolicy',
          ];

          initialState.forEach((i) => {
            this[i] = null;
          });

          this.stepPolicies.ready = false;
          this.stepValues.hidden = false;

          this.chartValues = {
            policy:    {},
            questions: {}
          };
          this.yamlOption = VALUES_STATE.FORM;
          this.yamlValues = '';

          // Remove the hash created from the tabbed component
          this.$router.replace({
            path:  this.$route.path,
            query: this.$route.query,
            hash:  ''
          });
        }
      });
    },

    async selectPolicy(policy) {
      this.selectedPolicyChart = policy;

      if (this.customPolicy) {
        this.hasCustomPolicy = true;
      } else {
        this.hasCustomPolicy = false;
      }

      await this.policyQuestions();
      this.stepPolicies.ready = true;
      this.$refs.wizard.next();
      this.bannerTitle = this.customPolicy ? 'Custom Policy' : (
        policy?.annotations?.[KUBEWARDEN_POLICY_ANNOTATIONS.DISPLAY_NAME] || policy?.name
      );
    },

    showReadme() {
      this.$refs.readmePanel?.show();
    }
  }

});
</script>

<template>
  <Loading v-if="isLoading" mode="relative" />
  <div v-else>
    <template v-if="!hideOfficialRepoBanner">
      <Banner
        data-testid="kw-policy-add-official-repo-banner"
        class="type-banner mb-20 mt-0"
        color="warning"
        :closable="true"
        @close="closeBanner('updateHideBannerOfficialRepo')"
      >
        <div>
          <p v-clean-html="t('kubewarden.policies.noOfficialPolicies', {}, true)" class="mb-10" />
          <AsyncButton mode="kubewardenPolicyCatalog" @click="addRepository" />
        </div>
      </Banner>
    </template>
    <template v-if="!hideRepoBanner">
      <Banner
        data-testid="kw-policy-add-repo-banner"
        class="type-banner mb-20 mt-0"
        color="warning"
        :closable="true"
        @close="closeBanner('updateHideBannerPolicyRepo')"
      >
        <p>{{ t('kubewarden.policies.noPolicyRepo') }}</p>
      </Banner>
    </template>
    <template v-if="!hideAirgapBanner">
      <Banner
        data-testid="kw-policy-create-ag-banner"
        class="type-banner mb-20 mt-0"
        color="warning"
        :closable="true"
        :label="t('kubewarden.policies.airgap.banner')"
        @close="closeBanner('updateHideBannerAirgapPolicy')"
      />
    </template>
    <Wizard
      v-if="value"
      ref="wizard"
      :value="value"
      data-testid="kw-policy-create-wizard"
      :errors="errors"
      :steps="steps"
      :show-banner="false"
      :edit-first-step="true"
      class="wizard"
      @next="reset"
      @cancel="done"
      @finish="finish"
    >
      <template #policies>
        <PolicyTable
          data-testid="kw-policy-create-table"
          :mode="mode"
          :charts="latestPolicyChartsVersion"
          @selectPolicy="selectPolicy($event)"
        />
      </template>

      <template #values>
        <div class="banner__title">
          <h2>{{ bannerTitle }}</h2>
          <template v-if="!customPolicy">
            <p class="banner__short-description">
              {{ shortDescription }}
            </p>
            <button
              v-if="selectedPolicyDetails && (selectedPolicyDetails?.readme || selectPolicyDetails?.appreadme) && !errorFetchingPolicy"
              class="btn btn-sm role-link banner__readme-button"
              @click="showReadme"
            >
              {{ t('kubewarden.policyConfig.description.showReadme') }}
            </button>
            <div v-else class="mb-10"></div>
          </template>
        </div>
        <Values
          :value="value"
          :chart-values="chartValues"
          :yaml-values="yamlValues"
          :mode="mode"
          :custom-policy="customPolicy"
          :error-fetching-policy="errorFetchingPolicy"
          @editor="$event => yamlOption = $event"
          @updateYamlValues="$event => yamlValues = $event"
        />
      </template>

      <template #finish>
        <AsyncButton
          data-testid="kw-policy-create-finish-button"
          :disabled="!canFinish"
          mode="finish"
          class="ml-20"
          @click="finish"
        />
      </template>
    </Wizard>

    <template v-if="selectedPolicyDetails && (selectedPolicyDetails?.readme || selectPolicyDetails?.appreadme) && !customPolicy && !errorFetchingPolicy">
      <PolicyReadmePanel
        ref="readmePanel"
        :policy-chart-details="selectedPolicyDetails"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
$padding: 5px;
$height: 110px;
$margin: 10px;
$color: var(--body-text) !important;

:deep(.header) {
  display: none;
}

:deep(.controls-row) {
  position: sticky;
  width: auto;

  .controls-steps {
    display: flex;
  }
}

:deep(.custom) {
  min-height: 110px;
}

:deep(.subtype) {
  height: $height;
  margin: $margin;
  position: relative;
  border-radius: calc( 1.5 * var(--border-radius));
  border: 1px solid var(--border);
  text-decoration: none !important;
  color: $color;

  &:hover:not(.disabled) {
    box-shadow: 0 0 30px var(--shadow);
    transition: box-shadow 0.1s ease-in-out;
    cursor: pointer;
    text-decoration: none !important;
  }

  .subtype__metadata {
    padding: $margin;

    &__label, &__description {
      padding-right: 20px;
    }
  }

  .subtype__badge {
    position: absolute;
    right: 0;
    top: 0;
    padding: 4px $padding;
    border-bottom-left-radius: var(--border-radius);

    label {
      font-size: 12px;
      line-height: 12px;
      text-align: center;
      display: block;
      white-space: no-wrap;
      text-overflow: ellipsis;
      color: var(--app-rancher-accent-text);
      margin: 0;
    }
  }

  .subtype__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
    line-height: initial;
  }

  .subtype__description {
    margin-right: $margin;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--input-label);
  }
}

:deep(.footer-error) {
  margin-top: 15px;
}

.wizard {
  position: relative;
  height: 100%;
  z-index: 1;
}

.banner {
  &__title {
    padding-top: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--border);
    min-height: 60px;
  }

  &__readme-button {
    padding: 0 7px 0 0;
  }
}
</style>
