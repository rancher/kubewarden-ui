<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { SECRET } from '@shell/config/types';
import {
  REGISTRY_TYPE,
  REGISTRY_TYPE_OPTIONS,
  SCAN_INTERVAL_OPTIONS, SCAN_INTERVALS
} from '@pkg/constants';
import { PRODUCT_NAME, PAGE } from '@pkg/types';
import { SECRET_TYPES } from '@shell/config/secret';

export default {
  name: 'CruRegistry',

  components: {
    LabeledInput,
    NameNsDescription,
    CruResource,
    LabeledSelect
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
    };
  },

  computed: {

    /**
     * Filter secrets given their namespace and required secret type
     *
     * Convert secrets to list of options and supplement with custom entries
     */
    options() {
      let filteredSecrets = [];

      if (this.allSecrets) {
        const currentNamespace = this.value.metadata?.namespace ? this.value.metadata.namespace : 'default';

        if (this.allSecrets) {
          // Filter secrets given their namespace
          filteredSecrets = this.allSecrets
            .filter((secret) => secret.metadata.namespace === currentNamespace)
            .filter((secret) => SECRET_TYPES.DOCKER_JSON === secret._type
            );
        }
      }

      const out = filteredSecrets.map((x) => {
        const { metadata, id } = x;
        const label = metadata.name;

        return {
          label,
          value: id.includes('/') ? id.split('/')[1] : id,
        };
      });

      out.unshift({
        label: this.t('generic.none'),
        value: '',
      });

      return out;
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

    validationPassed() {
      const spec = this.value?.spec || {};

      const hasName = !!this.value?.metadata?.name?.trim();
      const hasCatalogType = !!spec.catalogType;
      const hasUri = !!spec.uri?.trim();

      const requiresRepositories = spec.catalogType === REGISTRY_TYPE.NO_CATALOG;
      const hasRepositories = !requiresRepositories || !!spec.repositories?.length;

      return hasName && hasCatalogType && hasUri && hasRepositories;
    }
  },

  methods: {
    async finish(event) {
      if (this.value.spec.scanInterval === SCAN_INTERVALS.MANUAL) {
        delete this.value.spec.scanInterval;
      }

      try {
        await this.save(event);
      } catch (e) {
        this.errors.push(e);
      } finally {
        this.$router.push({
          name:   `c-cluster-${ PRODUCT_NAME }-${ PAGE.REGISTRIES }`,
          params: {
            cluster: this.$route.params.cluster,
            product: PRODUCT_NAME
          }
        });
      }
    }
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
          />
        </div>
      </div>
      <div class="registry-input-label mt-24">
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
            @update:value="update"
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
