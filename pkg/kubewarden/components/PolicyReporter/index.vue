<script>
import isEmpty from 'lodash/isEmpty';
import semver from 'semver';

import { SERVICE, WORKLOAD_TYPES } from '@shell/config/types';
import { KUBERNETES } from '@shell/config/labels-annotations';

import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';

import { handleGrowl } from '../../utils/handle-growl';
import { rootKubewardenRoute } from '../../utils/custom-routing';
import { KUBEWARDEN, KUBEWARDEN_CHARTS } from '../../types';

import InstallView from './InstallView';

export default {
  components: {
    Banner, InstallView, Loading
  },

  async fetch() {
    if ( this.hasPolicyServerSchema ) {
      this.controller = await this.$store.dispatch(`cluster/findMatching`, {
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        selector: `${ KUBERNETES.MANAGED_NAME }=${ KUBEWARDEN_CHARTS.CONTROLLER }`
      });
    }

    await this.policyReporterService();

    if ( !isEmpty(this.reporterUIService) ) {
      this.reporterUrl = this.policyReporterProxy();
    }
  },

  data() {
    return {
      rootKubewardenRoute,
      controller:               null,
      reporterReportingService: null,
      reporterUIService:        null,
      reporterUrl:              null
    };
  },

  computed: {
    hasPolicyServerSchema() {
      return this.$store.getters['cluster/schemaFor'](KUBEWARDEN.POLICY_SERVER);
    },

    hasClusterPolicyReportSchema() {
      return this.$store.getters['cluster/schemaFor'](KUBEWARDEN.CLUSTER_POLICY_REPORT);
    },

    hasPolicyReportSchema() {
      return this.$store.getters['cluster/schemaFor'](KUBEWARDEN.POLICY_REPORT);
    },

    reporterCrds() {
      return this.hasClusterPolicyReportSchema && this.hasPolicyReportSchema;
    },

    controllerNamespace() {
      if ( !isEmpty(this.controller) ) {
        return this.controller[0].metadata?.namespace;
      }

      return null;
    },

    controllerVersion() {
      if ( !isEmpty(this.controller) ) {
        return this.controller[0].metadata?.labels?.['app.kubernetes.io/version'];
      }

      return null;
    },

    canShowReporter() {
      if ( !this.controllerVersion ) {
        return false;
      }

      return semver.satisfies(this.controllerVersion, '>=1.7.0 || >=1.7.0-rc*', { includePrerelease: true });
    }
  },

  methods: {
    async policyReporterService() {
      try {
        const services = await this.$store.dispatch('cluster/findMatching', {
          type:     SERVICE,
          selector: 'app.kubernetes.io/part-of=policy-reporter'
        });

        if ( !isEmpty(services) ) {
          this.reporterReportingService = services.find(s => s.metadata?.labels?.['app.kubernetes.io/component'] === 'reporting');
          this.reporterUIService = services.find(s => s.metadata?.labels?.['app.kubernetes.io/name'] === 'ui');
        }
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
      }
    },

    policyReporterProxy() {
      try {
        const service = this.reporterUIService;

        if ( service ) {
          const base = `/api/v1/namespaces/${ service.metadata?.namespace }/services/`;
          const proxy = `http:${ service.metadata?.name }:${ service.spec?.ports?.[0].port }/proxy`;

          return base + proxy;
        }
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <template v-if="!hasPolicyServerSchema">
      <div>
        <h1 class="mb-20">
          {{ t('kubewarden.policyReporter.title') }}
        </h1>
        <Banner
          :label="t('kubewarden.policyReporter.noSchema.banner')"
          color="error"
          class="mt-20 mb-20"
        />
        <div class="install-route">
          <n-link :to="rootKubewardenRoute()">
            <button class="btn role-primary mt-20" data-testid="kw-pr-noschema-install-button">
              {{ t('kubewarden.policyReporter.noSchema.link') }}
            </button>
          </n-link>
        </div>
      </div>
    </template>
    <template v-else-if="!canShowReporter">
      <Banner
        color="error"
        class="mt-20 mb-20"
        data-testid="kw-pr-incompatibile-banner"
      >
        <p>{{ t('kubewarden.policyReporter.incompatible.banner') }}</p>
        <p v-if="controllerVersion" class="mt-10">
          {{ t('kubewarden.policyReporter.incompatible.current') }}: <span class="version-badge">{{ controllerVersion }}</span>
        </p>
      </Banner>
    </template>
    <template v-else-if="canShowReporter">
      <template v-if="!reporterCrds">
        <Banner
          :label="t('kubewarden.policyReporter.incompatible.noCrds.banner')"
          data-testid="kw-pr-no-crds-banner"
          color="error"
        />
      </template>
      <template v-else>
        <template v-if="!reporterReportingService">
          <Banner
            :label="t('kubewarden.policyReporter.service.main.banner.unavailable')"
            data-testid="kw-pr-main-service-unavailable-banner"
            color="warning"
          />
          <InstallView :controller-ns="controllerNamespace" />
        </template>
        <template v-else-if="!reporterUIService">
          <Banner
            :label="t('kubewarden.policyReporter.service.ui.banner.unavailable')"
            data-testid="kw-pr-ui-service-unavailable-banner"
            color="warning"
          />
        </template>
        <template v-if="reporterUrl">
          <div>
            <div class="reporter__header mb-20">
              <div
                class="reporter__external-link"
              >
                <a
                  :href="reporterUrl"
                  target="_blank"
                  rel="noopener nofollow"
                  data-testid="kw-pr-reporter-link"
                >
                  {{ t('kubewarden.policyReporter.link') }} <i class="icon icon-external-link" />
                </a>
              </div>
            </div>
            <div class="reporter__container">
              <iframe
                ref="frame"
                :src="reporterUrl"
                frameborder="0"
                data-testid="kw-pr-iframe"
              />
            </div>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<style lang='scss' scoped>
.version-badge {
  background: var(--primary);
  color: var(--primary-text);
  border-radius: var(--border-radius);
  padding: 4px 8px;
}

.install-route {
  display: flex;
  justify-content: center;
  align-items: center;
}

.reporter {
  &__header {
    display: flex;
    justify-content: right;
    align-items: center;
  }

  &__container {
    iframe {
      width: 100%;
      height: 80vh;
    }
  }
}
</style>
