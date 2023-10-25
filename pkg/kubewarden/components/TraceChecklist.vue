<script>
import { mapGetters } from 'vuex';

import { CATALOG } from '@shell/config/labels-annotations';
import {
  REPO_TYPE, REPO, CHART, NAME, VERSION, NAMESPACE
} from '@shell/config/query-params';

import { Banner } from '@components/Banner';

export default {
  props: {
    controllerApp: {
      type:    Object,
      default: null
    },
    tracingConfiguration: {
      type:    Object,
      default: null
    },
    jaegerQuerySvc: {
      type:    Object,
      default: null
    },
    openTelSvc: {
      type:    Object,
      default: null
    }
  },

  components: { Banner },

  computed: {
    ...mapGetters(['currentCluster']),

    disableChartInstall() {
      return !this.openTelSvc || !this.jaegerQuerySvc;
    },

    tracingEnabled() {
      if ( this.tracingConfiguration ) {
        return this.tracingConfiguration.enabled;
      }

      return null;
    }
  },

  methods: {
    chartRoute() {
      if ( this.controllerApp ) {
        const metadata = this.controllerApp.spec?.chart?.metadata;

        const query = {
          [NAMESPACE]: metadata?.annotations?.[CATALOG.NAMESPACE],
          [NAME]:      metadata?.annotations?.[CATALOG.RELEASE_NAME],
          [VERSION]:   metadata?.annotations?.['catalog.cattle.io/upstream-version'],
          [REPO]:      metadata?.annotations?.[CATALOG.SOURCE_REPO_NAME],
          [REPO_TYPE]: metadata?.annotations?.[CATALOG.SOURCE_REPO_TYPE],
          [CHART]:     metadata?.name
        };

        this.$router.push({
          name:   'c-cluster-apps-charts-install',
          params: { cluster: this.currentCluster?.id || '_' },
          query,
        });
      }
    }
  }
};
</script>

<template>
  <div>
    <p class="checklist__description mb-20" data-testid="kw-tracing-checklist-description">
      {{ t('kubewarden.tracing.description') }}
    </p>
    <div class="checklist__prereq mb-20">
      <h2>{{ t('kubewarden.tracing.prerequisites.label') }}</h2>
      <p>{{ t('kubewarden.tracing.prerequisites.description') }}</p>
    </div>
    <Banner
      color="warning"
      :label="t('kubewarden.tracing.prerequisites.warning')"
    />
    <div class="checklist__container mt-20 mb-20">
      <div class="checklist__step mt-20 mb-20" data-testid="kw-tracing-checklist-step-open-tel">
        <i class="icon mr-10" :class="{ 'icon-dot-open': !openTelSvc,'icon-checkmark': openTelSvc }" />
        <p v-clean-html="t('kubewarden.tracing.openTelemetry', {}, true)" />
      </div>
      <div class="checklist__step mb-20" data-testid="kw-tracing-checklist-step-jaeger">
        <i class="icon mr-10" :class="{ 'icon-dot-open': !jaegerQuerySvc,'icon-checkmark': jaegerQuerySvc }" />
        <p v-clean-html="t('kubewarden.tracing.jaeger', {}, true)" p />
      </div>
      <div class="checklist__step mb-20" data-testid="kw-tracing-checklist-step-config">
        <i class="icon mr-10" :class="{ 'icon-dot-open': !tracingEnabled,'icon-checkmark': tracingEnabled }" />
        <div class="checklist__config">
          <p v-clean-html="t('kubewarden.tracing.config.label', {}, true)" />
          <button
            data-testid="kw-tracing-checklist-step-config-button"
            class="btn role-primary ml-10"
            :disabled="disableChartInstall"
            @click.prevent="chartRoute"
          >
            {{ t("kubewarden.tracing.config.link") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.checklist {
  &__container {
    display: flex;
    justify-content: center;
    flex-direction: column;
    border: 1px solid var(--border);
    padding: 10px;
  }

  &__step, &__config {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
  }

  &__step {
    min-height: 40px;
  }
}
</style>