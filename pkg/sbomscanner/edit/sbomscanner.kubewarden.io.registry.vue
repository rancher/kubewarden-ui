<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Banner from '@components/Banner/Banner.vue';
import { SECRET } from '@shell/config/types';
import {
  REGISTRY_TYPE,
  REGISTRY_TYPE_OPTIONS,
  SCAN_INTERVAL_OPTIONS, SCAN_INTERVALS
} from '@sbomscanner/constants';
import { PRODUCT_NAME, PAGE, LOCAT_HOST } from '@sbomscanner/types';
import { SECRET_TYPES } from '@shell/config/secret';

export default {
  name: 'CruRegistry',

  components: {
    LabeledInput,
    NameNsDescription,
    CruResource,
    LabeledSelect,
    Banner,
  },

  mixins: [CreateEditView],

  async fetch() {
    this.allSecrets = await this.$store.dispatch(
      `${ this.inStore }/findAll`, { type: SECRET }
    );
  },

  data() {
    if (!this.value.spec) {
      this.value.spec = {
        catalogType:  REGISTRY_TYPE.OCI_DISTRIBUTION,
        authSecret:   '',
        uri:          '',
        repositories: [],
        scanInterval: SCAN_INTERVALS.MANUAL,
      };
    }

    if ( this.value.spec.scanInterval === null) {
      this.value.spec.scanInterval = SCAN_INTERVALS.MANUAL;
    }

    return {
      inStore:         this.$store.getters['currentProduct'].inStore,
      errors:          null,
      allSecrets:      null,
      filteredSecrets: null,
      PAGE,
      PRODUCT_NAME,
      authLoading:     false,
    };
  },

  computed: {

    /**
     * Build the options list for the authentication dropdown
     */
    options() {
      const headerOptions = [
        {
          label: this.t('imageScanner.registries.configuration.cru.authentication.create'),
          value: 'create',
          kind:  'highlighted'
        },
        {
          label:    'divider',
          disabled: true,
          kind:     'divider'
        },
        {
          label: this.t('generic.none'),
          value: '',
        }
      ];

      if (!this.allSecrets) {
        return headerOptions;
      }

      const currentNamespace = this.value.metadata?.namespace ?? 'default';

      const secretOptions = this.allSecrets
        .filter((secret) => {
          return secret.metadata.namespace === currentNamespace &&
                secret._type === SECRET_TYPES.DOCKER_JSON;
        })
        .map((secret) => {
          const name = secret.metadata.name;

          return {
            label: name,
            value: name,
          };
        });

      return [
        ...headerOptions,
        ...secretOptions
      ];
    },

    SCAN_INTERVAL_OPTIONS() {
      return SCAN_INTERVAL_OPTIONS;
    },

    REGISTRY_TYPE_OPTIONS() {
      return REGISTRY_TYPE_OPTIONS;
    },

    REGISTRY_TYPE() {
      return REGISTRY_TYPE;
    },

    /**
     * Validation for the CruResource save button.
     */
    validationPassed() {
      const spec = this.value?.spec || {};

      const hasName = !!this.value?.metadata?.name?.trim();
      const hasCatalogType = !!spec.catalogType;
      const hasUri = !!spec.uri?.trim();

      const requiresRepositories = spec.catalogType === REGISTRY_TYPE.NO_CATALOG;
      const hasRepositories = !requiresRepositories || !!spec.repositories?.length;

      const validSecret = spec.authSecret !== 'create';

      return hasName && hasCatalogType && hasUri && hasRepositories && validSecret;
    },

    secretCreateUrl() {
      const clusterId = this.$route.params.cluster;

      return `${ LOCAT_HOST.includes(window.location.host) ? '' : '/dashboard' }/c/${ clusterId }/explorer/secret/create?scope=namespaced`;
    },
  },

  methods: {
    async finish(event) {
      if (this.value.spec.scanInterval === SCAN_INTERVALS.MANUAL) {
        delete this.value.spec.scanInterval;
      }

      try {
        await this.save(event);
      } catch (e) {
        this.errors = [e];
      } finally {
        if (!this.errors || this.errors.length === 0) {
          this.$router.push({
            name:   `c-cluster-${ PRODUCT_NAME }-${ PAGE.REGISTRIES }`,
            params: {
              cluster: this.$route.params.cluster,
              product: PRODUCT_NAME
            }
          });
        }
      }
    },

    /**
     * Manually refresh the list of secrets for the dropdown.
     */
    async refreshList() {
      this.authLoading = true;
      try {
        this.allSecrets = await this.$store.dispatch(
          `${ this.inStore }/findAll`, { type: SECRET }
        );
      } catch (e) {
        this.errors = [e];
      } finally {
        this.authLoading = false;
      }
    },
  }
};
</script>

<template>
  <div class="filled-height">
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="value"
      :subtypes="[]"
      :errors="errors"
      :validation-passed="validationPassed"
      @finish="finish"
      @cancel="done"
    >
      <NameNsDescription
        name-label="imageScanner.registries.configuration.cru.registry.label"
        :value="value"
        :mode="mode"
        @update:value="$emit('input', $event)"
      />

      <div class="registry-input-label">
        {{ t('imageScanner.registries.configuration.cru.registry.label') }}
      </div>

      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="value.spec.catalogType"
            data-testid="registry-type-select"
            :label="t('imageScanner.registries.configuration.cru.registry.type.label')"
            :options="REGISTRY_TYPE_OPTIONS"
            option-key="value"
            option-label="label"
            required
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.uri"
            :label="t('imageScanner.registries.configuration.cru.registry.uri.label')"
            :placeholder="t('imageScanner.registries.configuration.cru.registry.uri.placeholder')"
            required
          />
        </div>
      </div>
      <div class="registry-input-label mt-24">
        {{ t('imageScanner.registries.configuration.cru.authentication.label') }}
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="value.spec.authSecret"
            data-testid="auth-secret-select"
            :label="t('imageScanner.registries.configuration.cru.authentication.label')"
            :mode="mode"
            :options="options"
            :loading="authLoading"
          />
        </div>
      </div>
      <div
        v-if="value.spec.authSecret === 'create' "
        class="row"
      >
        <div class="col span-12">
          <Banner color="info">
            <div>
              <p class="m-0 mb-5">
                {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine1_start') }}
                <a
                  :href="secretCreateUrl"
                  target="_blank"
                >
                  {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine1_link') }}
                </a>
                {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine1_end') }}
              </p>

              <p class="m-0">
                {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine2_start') }}
                <a
                  href="#"
                  @click.prevent="refreshList"
                >
                  {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine2_link') }}
                </a>
                {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine2_end') }}
              </p>
            </div>
          </Banner>
        </div>
      </div>
      <div :class="['registry-input-label', { 'mt-24': value.spec.authSecret !== 'create' }]">
        {{ t('imageScanner.registries.configuration.cru.scan.label') }}
      </div>

      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="value.spec.repositories"
            data-testid="registry-scanning-repository-names"
            :taggable="true"
            :searchable="true"
            :push-tags="true"
            :close-on-select="false"
            :mode="mode"
            :multiple="true"
            :label="t('imageScanner.registries.configuration.cru.scan.repoName')"
            :placeholder="value.spec.catalogType === REGISTRY_TYPE.OCI_DISTRIBUTION ? t('imageScanner.registries.configuration.cru.scan.placeholder.ociDistribution') : t('imageScanner.registries.configuration.cru.scan.placeholder.nocatalog')"
            :options="value.spec.repositories || []"
            :disabled="mode==='view'"
            :required="value.spec.catalogType === REGISTRY_TYPE.NO_CATALOG"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            v-model:value="value.spec.scanInterval"
            data-testid="registry-scanning-interval-select"
            :placeholder="t('imageScanner.registries.configuration.cru.scan.schedule.placeholder', { manualScan: t('imageScanner.registries.configuration.cru.scan.schedule.manualScan') })"
            :options="SCAN_INTERVAL_OPTIONS"
            option-key="value"
            option-label="label"
            :label="t('imageScanner.registries.configuration.cru.scan.schedule.label')"
            required
          />
        </div>
      </div>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
.registry-input-label {
  margin-bottom: 16px;
  font-size: 16px;
  line-height: 20px;
  font-weight: 400;
  font-family: 'Lato', sans-serif;
  color: var(--disabled-text);
  display: block;
}
.mt-24 {
  margin-top: 24px;
}
</style>
