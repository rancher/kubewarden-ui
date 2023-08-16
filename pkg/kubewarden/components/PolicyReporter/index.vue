<script>
import isEmpty from 'lodash/isEmpty';

import { SERVICE } from '@shell/config/types';
import { Banner } from '@components/Banner';

import { handleGrowl } from '../../utils/handle-growl';
import { rootKubewardenRoute } from '../../utils/custom-routing';
import { KUBEWARDEN } from '../../types';

import InstallView from './InstallView';

export default {
  components: { Banner, InstallView },

  async fetch() {
    this.reporterService = await this.policyReporterService();

    if ( !isEmpty(this.reporterService) ) {
      this.reporterUrl = this.policyReporterProxy();
    }
  },

  data() {
    return {
      rootKubewardenRoute,
      reporterService: null,
      reporterUrl:     null
    };
  },

  computed: {
    hasPolicyServerSchema() {
      return this.$store.getters['cluster/schemaFor'](KUBEWARDEN.POLICY_SERVER);
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
          return services.find(s => s.metadata?.labels?.['app.kubernetes.io/name'] === 'ui');
        }
      } catch (e) {
        handleGrowl({ error: e, store: this.$store });
      }
    },

    policyReporterProxy() {
      try {
        const service = this.reporterService;

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
  <div>
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
    <template v-else-if="!reporterService">
      <div>
        <Banner
          :label="t('kubewarden.policyReporter.service.banner.unavailable')"
          data-testid="kw-pr-service-unavailable-banner"
          color="warning"
        />
      </div>
      <InstallView />
    </template>
    <template v-else-if="reporterUrl">
      <div>
        <div class="reporter__header mb-20">
          <div
            class="reporter__external-link"
          >
            <a
              :href="reporterUrl"
              target="_blank"
              rel="noopener nofollow"
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
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style lang='scss' scoped>
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
