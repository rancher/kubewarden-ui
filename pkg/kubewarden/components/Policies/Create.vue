<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';

import CreateEditView from '@shell/mixins/create-edit-view';
import { NAMESPACE } from '@shell/config/types';
import { _CREATE } from '@shell/config/query-params';
import { saferDump } from '@shell/utils/create-yaml';
import { set } from '@shell/utils/object';

import { Banner } from '@components/Banner';

import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import Wizard from '@shell/components/Wizard';

import {
  KUBEWARDEN,
  KUBEWARDEN_PRODUCT_NAME,
  REGO_POLICIES_REPO,
  VALUES_STATE,
  ARTIFACTHUB_PKG_ANNOTATION,
  DEFAULT_POLICY
} from '@kubewarden/types';
import { removeEmptyAttrs } from '@kubewarden/utils/object';
import { handleGrowl } from '@kubewarden/utils/handle-growl';

import { DATA_ANNOTATIONS } from '@kubewarden/types/artifacthub';
import PolicyTable from './PolicyTable';
import PolicyReadmePanel from './PolicyReadmePanel';
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
    if (this.hasArtifactHub) {
      await this.$store.dispatch('kubewarden/fetchPackages', { value: this.value });
    }

    this.value.apiVersion = `${ this.schema?.attributes?.group }.${ this.schema?.attributes?.version }`;
    this.value.kind = this.schema?.attributes?.kind;
  },

  data() {
    return {
      bannerTitle:       null,
      shortDescription:  null,
      type:              null,
      typeModule:        null,
      version:           null,

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
    isAirgap() {
      return this.$store.getters['kubewarden/airGapped'];
    },

    isCreate() {
      return this.realMode === _CREATE;
    },

    isSelected() {
      return !!this.type;
    },

    customPolicy() {
      return this.type === 'custom';
    },

    /** Allow create if either editing in yaml view or module and required rules/settings have been met */
    canFinish() {
      if (this.yamlOption === VALUES_STATE.YAML) {
        return true;
      }

      return !!this.chartValues?.policy?.spec?.module && this.hasRequired;
    },

    hasArtifactHub() {
      return this.value.artifactHubWhitelist;
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

    hideArtifactHubBanner() {
      return this.$store.getters['kubewarden/hideBannerArtifactHub'] || !!this.hasArtifactHub || !!this.isAirgap;
    },

    hideAirgapBanner() {
      return !this.isAirgap || this.$store.getters['kubewarden/hideBannerAirgapPolicy'];
    },

    packageValues() {
      if (this.type?.repository?.url) {
        return this.packages?.find((p) => p.repository?.url === this.type.repository.url);
      }

      return null;
    },

    steps() {
      const steps = [];

      steps.push(
        this.stepPolicies,
        this.stepValues
      );

      return steps.sort((a, b) => b.weight - a.weight);
    },

    packages() {
      return this.$store.getters['kubewarden/packages'];
    },

    packageDetailsByKey() {
      return this.$store.getters['kubewarden/packageDetailsByKey'];
    },

    loadingPackages() {
      return this.$store.getters['kubewarden/loadingPackages'];
    },
  },

  methods: {
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
          if (!isEmpty(requiredProp[key])) {
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

    async addArtifactHub(btnCb) {
      try {
        this.loadingPackages = true;

        await this.value.updateWhitelist('artifacthub.io');
        await this.getPackages();

        btnCb(true);
        this.loadingPackages = false;
      } catch (e) {
        handleGrowl({
          error: e,
          store: this.$store
        });

        btnCb(false);
        this.loadingPackages = false;
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

    /** Fetch packages from ArtifactHub repository */
    async getPackages() {
      this.repository = await this.value.artifactHubRepo();

      if (this.repository && this.repository.packages.length > 0) {
        const packagesByRepo = this.repository.packages.filter((pkg) => !pkg?.repository?.url?.includes(REGO_POLICIES_REPO));
        const promises = packagesByRepo.map((pkg) => this.packageDetails(pkg));

        try {
          const packages = await Promise.all(promises);

          this.packages = packages.filter((pkg) => pkg?.data?.['kubewarden/hidden-ui'] !== 'true');
        } catch (e) {
          handleGrowl({
            error: e,
            store: this.$store
          });

          console.warn(`Error fetching packages`, e);
        }
      }
    },

    packageDetails(pkg) {
      return this.packageDetailsByKey(pkg?.package_id);
    },

    /** Extract policy questions from ArtifactHub package if available */
    policyQuestions() {
      const defaultPolicy = structuredClone(DEFAULT_POLICY);

      if (this.customPolicy) {
        // Add contextAwareResources to custom policy spec
        const updatedCustomPolicy = { spec: { contextAwareResources: [] } };

        merge(defaultPolicy, updatedCustomPolicy);
        set(this.chartValues, 'policy', defaultPolicy);
        this.yamlValues = saferDump(defaultPolicy);

        return;
      }

      const policyDetails = this.packages.find((pkg) => pkg.repository?.url === this.type?.repository?.url);
      const packageQuestions = this.value.parsePackageMetadata(policyDetails?.data?.[DATA_ANNOTATIONS.QUESTIONS]);
      const packageAnnotation = `${ policyDetails?.repository?.name }/${ policyDetails?.name }/${ policyDetails?.version }`;
      /** Return spec from package if annotation exists */
      const parseAnnotation = (annotation, obj) => {
        const spec = this.value.parsePackageMetadata(policyDetails?.data?.[annotation]);

        if (spec?.[obj] !== undefined) {
          return spec[obj];
        }

        return spec || [];
      };

      /** Return value of annotation if it exists */
      const determineAnnotation = (annotation) => {
        if (policyDetails?.data?.[annotation] !== undefined) {
          return JSON.parse(policyDetails.data[annotation]);
        }

        return false;
      };

      const updatedPolicy = {
        apiVersion: this.value.apiVersion,
        kind:       this.value.kind,
        metadata:   { annotations: { [ARTIFACTHUB_PKG_ANNOTATION]: packageAnnotation } },
        spec:       {
          module:                policyDetails?.containers_images[0].image,
          contextAwareResources: parseAnnotation(DATA_ANNOTATIONS.CONTEXT_AWARE, 'contextAwareResources'),
          rules:                 parseAnnotation(DATA_ANNOTATIONS.RULES, 'rules'),
          mutating:              determineAnnotation(DATA_ANNOTATIONS.MUTATION)
        }
      };

      merge(defaultPolicy, updatedPolicy);
      set(this.chartValues, 'policy', defaultPolicy);

      this.yamlValues = saferDump(defaultPolicy);

      if (packageQuestions) {
        set(this.chartValues, 'questions', packageQuestions);
      }

      this.shortDescription = policyDetails?.description;
    },

    reset(event) {
      this.$nextTick(() => {
        if (event.step?.name === this.stepPolicies.name) {
          const initialState = [
            'errors',
            'bannerTitle',
            'shortDescription',
            'type',
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
        }
      });
    },

    selectType(type) {
      this.type = type;

      if (this.customPolicy) {
        this.hasCustomPolicy = true;
      } else {
        this.hasCustomPolicy = false;
      }

      this.policyQuestions();
      this.stepPolicies.ready = true;
      this.$refs.wizard.next();
      this.bannerTitle = this.customPolicy ? 'Custom Policy' : type?.display_name;
      this.typeModule = this.chartValues?.policy?.spec.module;
    },

    showReadme() {
      this.$refs.readmePanel.show();
    }
  }

});
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else>
    <template v-if="!hideArtifactHubBanner">
      <Banner
        data-testid="kw-policy-create-ah-banner"
        class="type-banner mb-20 mt-0"
        color="warning"
        :closable="true"
        @close="closeBanner('updateHideBannerArtifactHub')"
      >
        <div>
          <p v-clean-html="t('kubewarden.policies.noArtifactHub', {}, true)" class="mb-10" />
          <AsyncButton mode="artifactHub" @click="addArtifactHub" />
        </div>
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
    <Loading v-if="loadingPackages" />
    <Wizard
      v-if="value && !loadingPackages"
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
          :value="packages"
          @selectType="selectType($event)"
        />
      </template>

      <template #values>
        <div class="banner__title">
          <h2>{{ bannerTitle }}</h2>
          <template v-if="!customPolicy">
            <p class="banner__short-description">
              {{ shortDescription }}
            </p>
            <button class="btn btn-sm role-link banner__readme-button" @click="showReadme">
              {{ t('kubewarden.policyConfig.description.showReadme') }}
            </button>
          </template>
        </div>
        <Values
          :value="value"
          :chart-values="chartValues"
          :yaml-values="yamlValues"
          :mode="mode"
          :custom-policy="customPolicy"
          @editor="$event => yamlOption = $event"
          @updateYamlValues="$event => yamlValues = $event"
        />
      </template>

      <template #finish>
        <AsyncButton
          data-testid="kw-policy-create-finish-button"
          :disabled="!canFinish"
          mode="finish"
          @click="finish"
        />
      </template>
    </Wizard>

    <template v-if="packageValues && !customPolicy">
      <PolicyReadmePanel
        ref="readmePanel"
        :package-values="packageValues"
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
