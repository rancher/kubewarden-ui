<script>
import jsyaml from 'js-yaml';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import ChartMixin from '@shell/mixins/chart';
import CreateEditView from '@shell/mixins/create-edit-view';
import { _CREATE, CHART, REPO, REPO_TYPE } from '@shell/config/query-params';
import { saferDump } from '@shell/utils/create-yaml';
import { set } from '@shell/utils/object';

import { Banner } from '@components/Banner';

import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import Markdown from '@shell/components/Markdown';
import Wizard from '@shell/components/Wizard';

import { NAMESPACE_SELECTOR } from '../../plugins/kubewarden/policy-class';
import { KUBEWARDEN, KUBEWARDEN_PRODUCT_NAME } from '../../types';

import PolicyGrid from './PolicyGrid';
import Values from './Values';

export default ({
  name: 'Create',

  components: {
    AsyncButton,
    Banner,
    Loading,
    Markdown,
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
      default:  () => {}
    },
  },

  mixins: [ChartMixin, CreateEditView],

  async fetch() {
    this.errors = [];

    if ( this.hasArtifactHub ) {
      await this.getPackages();
    }

    if ( !this.chartValues ) {
      try {
        // Without importing this here the object would maintain the state
        this.questions = await import(/* webpackChunkName: "questions-data" */ '../../questions/questions.json');
        const _questions = cloneDeep(JSON.parse(JSON.stringify(this.questions)));

        // This object will need to be refactored when helm charts exist for policies
        this.chartValues = { questions: _questions };
      } catch (e) {
        console.warn(`Error importing questions ${ e }`); // eslint-disable-line no-console
      }
    }

    this.defaultPolicy = require(`../../questions/policies/defaultPolicy.json`);

    this.yamlValues = saferDump(this.defaultPolicy);

    this.value.apiVersion = `${ this.schema?.attributes?.group }.${ this.schema?.attributes?.version }`;
    this.value.kind = this.schema?.attributes?.kind;
  },

  data() {
    return {
      errors:            null,
      packages:          null,
      questions:         null,
      repository:        null,
      splitType:         null,
      type:              null,
      typeModule:        null,
      version:           null,

      chartValues:       null,
      yamlValues:        null,
      defaultPolicy:     null,

      hasCustomPolicy: false,

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

  watch: {
    hasCustomPolicy(neu, old) {
      if ( !old ) {
        this.policyQuestions(neu);
      }
    }
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
      return !!this.chartValues.policy.spec.module && this.hasRequiredRules;
    },

    hasArtifactHub() {
      if ( this.whitelistSetting ) {
        const whitelistValue = this.whitelistSetting.value.split(',');
        const hasSetting = whitelistValue.includes('artifacthub.io');

        if ( hasSetting ) {
          this.getPackages();
        }

        return hasSetting;
      }

      return false;
    },

    /*
      Determines if the required rules are set, if not the resource can not be created
    */
    hasRequiredRules() {
      const { rules } = this.chartValues.policy.spec;
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

    readme() {
      if ( this.type ) {
        const pkg = this.packages?.find(p => p.name === this.type);

        return pkg?.readme;
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
    },

    whitelistSetting() {
      return this.value.whitelistSetting;
    }
  },

  methods: {
    async addArtifactHub(btnCb) {
      try {
        await this.value.updateWhitelist('artifacthub.io');
        btnCb(true);
      } catch (err) {
        this.errors = err;
        btnCb(false);
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
        const { ignoreRancherNamespaces } = this.chartValues.policy;

        if ( ignoreRancherNamespaces ) {
          set(this.chartValues.policy.spec, 'namespaceSelector', { matchExpressions: [NAMESPACE_SELECTOR] });
          delete this.chartValues.policy.ignoreRancherNamespaces;
        }

        const out = this.chartValues?.policy ? this.chartValues.policy : jsyaml.load(this.yamlValues);

        merge(this.value, out);

        await this.save(event);
      } catch (e) {
        this.errors.push(e);
      }
    },

    async getPackages() {
      this.repository = await this.value.artifactHubRepo();

      if ( this.repository && this.repository.packages.length > 0 ) {
        const promises = this.repository.packages.map(pkg => this.packageDetails(pkg));

        try {
          this.packages = await Promise.all(promises);
        } catch (e) {
          console.warn(`Error fetching packages: ${ e }`); // eslint-disable-line no-console
        }
      }
    },

    async packageDetails(pkg) {
      try {
        return await this.value.artifactHubPackage(pkg);
      } catch (e) {}
    },

    policyQuestions(isCustom) {
      const shortType = !!isCustom ? 'defaultPolicy' : this.type?.replace(`${ KUBEWARDEN.SPOOFED.POLICIES }.`, '');
      let match, questionsMatch;

      try {
        match = require(`../../questions/policies/${ shortType }.json`);
      } catch (e) {
        console.warn('Error when matching policy chart, falling back to default'); // eslint-disable-line no-console
        match = this.defaultPolicy;
      }

      set(this.chartValues, 'policy', match);

      // Spoofing the questions object from hard-typed questions json for each policy
      if ( match?.spec?.settings && !isEmpty(match.spec.settings) ) {
        try {
          questionsMatch = require(`../../questions/policy-questions/${ shortType }.json`);
        } catch (e) {
          console.warn('Error when matching policy questions'); // eslint-disable-line no-console
        }

        if ( questionsMatch ) {
          set(this.chartValues.questions, 'questions', questionsMatch);
        }
      }
    },

    reset() {
      this.$nextTick(() => {
        const initialState = [
          'errors',
          'splitType',
          'type',
          'typeModule',
          'chartValues.policy',
          'yamlValues'
        ];

        initialState.forEach((i) => {
          this[i] = null;
        });
      });
    },

    selectType(type) {
      this.type = type;
      const isCustom = type === 'custom';

      if ( isCustom ) {
        this.stepReadme.hidden = true;
        this.$set(this, 'hasCustomPolicy', true);
      } else {
        this.stepReadme.hidden = false;
        this.$set(this, 'hasCustomPolicy', false);
      }

      this.$router.push({
        query: {
          [REPO]:      KUBEWARDEN_PRODUCT_NAME,
          [REPO_TYPE]: 'cluster',
          [CHART]:     isCustom ? 'custom' : type.replace(`${ KUBEWARDEN.SPOOFED.POLICIES }.`, '')
        }
      });

      this.policyQuestions();
      this.stepPolicies.ready = true;
      this.$refs.wizard.next();
      this.splitType = type.split('policies.kubewarden.io.policies.')[1];
      this.typeModule = this.chartValues?.policy?.spec.module;
    }
  }

});
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else>
    <Wizard
      v-if="value"
      ref="wizard"
      v-model="value"
      :errors="errors"
      :steps="steps"
      :edit-first-step="true"
      :banner-title="splitType"
      :banner-title-subtext="typeModule"
      class="wizard"
      @back="reset"
      @cancel="done"
      @finish="finish"
    >
      <template #policies>
        <PolicyGrid :value="packages" @selectType="selectType($event)">
          <template v-if="!hasArtifactHub" #whitelistBanner>
            <Banner
              class="type-banner mb-20 mt-0"
              color="warning"
            >
              <div>
                <p class="mb-10">
                  {{ t('kubewarden.policies.noArtifactHub') }}
                </p>
                <AsyncButton mode="artifactHub" @click="addArtifactHub" />
              </div>
            </Banner>
          </template>

          <template #customSubtype>
            <div class="subtype" @click="selectType('custom')">
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
        <Markdown v-if="readme" :value="readme" class="mb-20" />
      </template>

      <template #values>
        <Values :value="value" :chart-values="chartValues" :mode="mode" :custom-policy="customPolicy" />
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
    .steps {
      & .divider {
        top: 22px;
      }
    }
  }
}

::v-deep .controls-row {
    .controls-steps {
      display: flex;
    }
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
