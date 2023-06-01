<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';

import CreateEditView from '@shell/mixins/create-edit-view';
import { _CREATE, CHART, REPO, REPO_TYPE } from '@shell/config/query-params';
import { saferDump } from '@shell/utils/create-yaml';
import { set } from '@shell/utils/object';

import { Banner } from '@components/Banner';

import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import ChartReadme from '@shell/components/ChartReadme';
import Wizard from '@shell/components/Wizard';

import { ARTIFACTHUB_PKG_ANNOTATION, NAMESPACE_SELECTOR } from '../../plugins/kubewarden-class';
import { DEFAULT_POLICY } from '../../plugins/policy-class';
import { KUBEWARDEN_PRODUCT_NAME, VALUES_STATE } from '../../types';
import { removeEmptyAttrs } from '../../utils/object';
import { handleGrowlError } from '../../utils/handle-growl';

import PolicyGrid from './PolicyGrid';
import Values from './Values';

export default ({
  name: 'Create',

  components: {
    AsyncButton,
    Banner,
    Loading,
    ChartReadme,
    Wizard,
    PolicyGrid,
    Values
  },

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

  mixins: [CreateEditView],

  async fetch() {
    this.errors = [];

    if ( this.hasArtifactHub ) {
      await this.getPackages();
    }

    this.value.apiVersion = `${ this.schema?.attributes?.group }.${ this.schema?.attributes?.version }`;
    this.value.kind = this.schema?.attributes?.kind;
  },

  data() {
    return {
      errors:            [],
      bannerTitle:       null,
      loadingPackages:   false,
      packages:          null,
      repository:        null,
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

      // Steps
      stepPolicies: {
        hidden: false,
        name:   'policies',
        label:  'Policies',
        ready:  false,
        weight: 99
      },
      stepReadme: {
        hidden: false,
        name:   'readme',
        label:  'Readme',
        ready:  true,
        weight: 98
      },
      stepValues: {
        name:   'values',
        label:  'Values',
        ready:  true,
        weight: 97
      },
    };
  },

  computed: {
    isCreate() {
      return this.realMode === _CREATE;
    },

    isSelected() {
      return !!this.type;
    },

    customPolicy() {
      return this.type === 'custom';
    },

    canFinish() {
      if ( this.yamlOption === VALUES_STATE.YAML ) {
        return true;
      }

      return !!this.chartValues?.policy?.spec?.module && this.hasRequiredRules;
    },

    hasArtifactHub() {
      return this.value.artifactHubWhitelist;
    },

    /*
      Determines if the required rules are set, if not the resource can not be created
    */
    hasRequiredRules() {
      const { rules } = this.chartValues?.policy?.spec;
      const requiredProps = ['apiGroups', 'apiVersions', 'operations', 'resources'];

      const acceptedRule = rules?.find((rule) => {
        const match = [];

        for ( const prop of requiredProps.values() ) {
          if ( !isEmpty(rule[prop]) ) {
            match.push(prop);
          }
        }

        if ( isEqual(match, requiredProps) ) {
          return rule;
        }

        return null;
      });

      if ( !isEmpty(acceptedRule) ) {
        return true;
      }

      return false;
    },

    packageValues() {
      if ( this.type?.name ) {
        const pkg = this.packages?.find(p => p.name === this.type.name);

        return pkg;
      }

      return null;
    },

    steps() {
      const steps = [];

      steps.push(
        this.stepPolicies,
        this.stepReadme,
        this.stepValues
      );

      return steps.sort((a, b) => b.weight - a.weight);
    }
  },

  methods: {
    async addArtifactHub(btnCb) {
      try {
        this.loadingPackages = true;

        await this.value.updateWhitelist('artifacthub.io');
        await this.getPackages();

        btnCb(true);
        this.loadingPackages = false;
      } catch (e) {
        handleGrowlError({ error: e, store: this.$store });

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
        const { ignoreRancherNamespaces } = this.chartValues.policy;

        if ( ignoreRancherNamespaces ) {
          set(this.chartValues.policy.spec, 'namespaceSelector', { matchExpressions: [NAMESPACE_SELECTOR] });
          delete this.chartValues.policy.ignoreRancherNamespaces;
        }

        if ( this.yamlOption === VALUES_STATE.YAML ) {
          out = jsyaml.load(this.yamlValues);
        } else {
          out = this.chartValues?.policy ? this.chartValues.policy : jsyaml.load(this.yamlValues);
        }

        removeEmptyAttrs(out); // Clean up empty values from questions
        merge(this.value, out);

        await this.save(event);
      } catch (e) {
        handleGrowlError({ error: e, store: this.$store });

        console.error('Error creating policy', e); // eslint-disable-line no-console
      }
    },

    async getPackages() {
      this.repository = await this.value.artifactHubRepo();

      if ( this.repository && this.repository.packages.length > 0 ) {
        const promises = this.repository.packages.map(pkg => this.packageDetails(pkg));

        try {
          const packages = await Promise.all(promises);

          this.packages = packages.filter(pkg => pkg?.data?.['kubewarden/hidden-ui'] !== 'true');
        } catch (e) {
          handleGrowlError({ error: e, store: this.$store });

          console.warn(`Error fetching packages`, e); // eslint-disable-line no-console
        }
      }
    },

    async packageDetails(pkg) {
      try {
        return await this.value.artifactHubPackage(pkg);
      } catch (e) {}
    },

    policyQuestions() {
      const defaultPolicy = structuredClone(DEFAULT_POLICY);

      if ( this.type === 'custom' ) {
        set(this.chartValues, 'policy', defaultPolicy);
        this.yamlValues = saferDump(defaultPolicy);

        return;
      }

      const policyDetails = this.packages.find(pkg => pkg.name === this.type?.name);
      const packageQuestions = this.value.parsePackageMetadata(policyDetails?.data?.['kubewarden/questions-ui']);
      const packageAnnotation = `${ policyDetails.repository.name }/${ policyDetails.name }/${ policyDetails.version }`;
      const packageRules = () => {
        const out = this.value.parsePackageMetadata(policyDetails?.data?.['kubewarden/rules']);

        if ( out?.rules !== undefined ) {
          return out.rules;
        }

        return out || [];
      };

      const determineAnnotation = (annotation) => {
        if ( policyDetails?.data?.[annotation] !== undefined ) {
          return JSON.parse(policyDetails.data[annotation]);
        }

        return false;
      };

      const updatedPolicy = {
        apiVersion: this.value.apiVersion,
        kind:       this.value.kind,
        metadata:   { annotations: { [ARTIFACTHUB_PKG_ANNOTATION]: packageAnnotation } },
        spec:       {
          module:       policyDetails.containers_images[0].image,
          contextAware: determineAnnotation('kubewarden/contextAware'),
          mutating:     determineAnnotation('kubewarden/mutation'),
          rules:        packageRules()
        }
      };

      merge(defaultPolicy, updatedPolicy);
      set(this.chartValues, 'policy', defaultPolicy);

      this.yamlValues = saferDump(defaultPolicy);

      if ( packageQuestions ) {
        set(this.chartValues, 'questions', packageQuestions);
      }
    },

    reset(event) {
      this.$nextTick(() => {
        if ( event.step?.name === this.stepPolicies.name ) {
          const initialState = [
            'errors',
            'bannerTitle',
            'type',
            'typeModule',
            'version',
            'hasCustomPolicy',
          ];

          initialState.forEach((i) => {
            this[i] = null;
          });

          this.stepPolicies.ready = false;
          this.stepReadme.hidden = false;

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
      const isCustom = type === 'custom';

      if ( isCustom ) {
        this.stepReadme.hidden = true;
        this.$set(this, 'hasCustomPolicy', true);
      } else {
        !!this.packageValues ? this.stepReadme.hidden = false : this.stepReadme.hidden = true;
        this.$set(this, 'hasCustomPolicy', false);
      }

      this.$router.push({
        query: {
          [REPO]:      KUBEWARDEN_PRODUCT_NAME,
          [REPO_TYPE]: 'cluster',
          [CHART]:     isCustom ? 'custom' : type?.name
        }
      });

      this.policyQuestions();
      this.stepPolicies.ready = true;
      this.$refs.wizard.next();
      this.bannerTitle = isCustom ? 'Custom Policy' : type?.display_name;
      this.typeModule = this.chartValues?.policy?.spec.module;
    }
  }

});
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else>
    <template v-if="!hasArtifactHub">
      <Banner
        class="type-banner mb-20 mt-0"
        color="warning"
      >
        <div>
          <p class="mb-10" v-html="t('kubewarden.policies.noArtifactHub', {}, true)" />
          <AsyncButton mode="artifactHub" @click="addArtifactHub" />
        </div>
      </Banner>
    </template>
    <Loading v-if="loadingPackages" />
    <Wizard
      v-if="value && !loadingPackages"
      ref="wizard"
      v-model="value"
      :errors="errors"
      :steps="steps"
      :edit-first-step="true"
      :banner-title="bannerTitle"
      :banner-title-subtext="typeModule"
      class="wizard"
      @next="reset"
      @cancel="done"
      @finish="finish"
    >
      <template #policies>
        <PolicyGrid :value="packages" @selectType="selectType($event)">
          <template #customSubtype>
            <div class="subtype custom" @click="selectType('custom')">
              <div class="subtype__metadata">
                <div class="subtype__badge" :style="{ 'background-color': 'var(--darker)' }">
                  <label>{{ t('kubewarden.customPolicy.badge') }}</label>
                </div>

                <h4 class="subtype__label">
                  {{ t('kubewarden.customPolicy.title') }}
                </h4>

                <div class="subtype__description">
                  {{ t('kubewarden.customPolicy.description') }}
                </div>
              </div>
            </div>
          </template>
        </PolicyGrid>
      </template>

      <template #readme>
        <ChartReadme v-if="packageValues" :version-info="packageValues" class="mb-20" />
      </template>

      <template #values>
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
          :disabled="!canFinish"
          mode="finish"
          @click="finish"
        />
      </template>
    </Wizard>
  </div>
</template>

<style lang="scss" scoped>
$padding: 5px;
$height: 110px;
$margin: 10px;
$color: var(--body-text) !important;

::v-deep .step-container {
  height: auto;
}

::v-deep .header {
  .step-sequence {
    display: block;

    .steps {
      & .divider {
        top: 22px;
      }
    }
  }
}

::v-deep .controls-row {
  position: sticky;
  bottom: 0;
  background: var(--body-bg);
  margin-top: 24px;
  z-index: 100;

  .controls-steps {
    display: flex;
  }
}

::v-deep .custom {
  min-height: 110px;
}

::v-deep .subtype {
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

  &__metadata {
    padding: $margin;

    &__label, &__description {
      padding-right: 20px;
    }
  }

  &__badge {
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

  &__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
    line-height: initial;
  }

  &__description {
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
</style>
