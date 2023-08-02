<script>
import isEmpty from 'lodash/isEmpty';

import { Banner } from '@components/Banner';

import InstallView from './InstallView';

export default {
  props: {
    value: {
      type:     Object,
      required: true
    }
  },

  components: { Banner, InstallView },

  async fetch() {
    this.reporterService = await this.value.policyReporterService();

    if ( !isEmpty(this.reporterService) ) {
      this.reporterUrl = await this.value.policyReporterProxy();
    }
  },

  data() {
    return {
      reporterService: null,
      reporterUrl:     null
    };
  }
};
</script>

<template>
  <div>
    <template v-if="!reporterService">
      <div>
        <Banner
          :label="t('kubewarden.policyReporter.service.banner.unavailable')"
          color="warning"
        />
      </div>
      <InstallView />
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
