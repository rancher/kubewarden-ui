<template>
  <div class="vulnerability-record">
    <div class="cve">
      <RouterLink :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${PAGE.VULNERABILITIES}/${vulnerability.metadata.name}`">
        {{ vulnerability.metadata.name }}
      </RouterLink>
    </div>
    <ScoreBadge
      :score="vulnerability.spec.scoreV3"
      score-type="v3"
    />
    <div class="impacted-container">
      <div class="impacted">
        <span>{{ vulnerability.spec.impactedImages_count }}</span>
        <BlockPercentageBar
          class="percentage-bar"
          :percentage="vulnerability.spec.totalImages > 0 ? (vulnerability.spec.impactedImages / vulnerability.spec.totalImages) * 100 : 0"
          :event-handler="resize"
        />
      </div>
    </div>
  </div>
</template>

<script>
import BlockPercentageBar from './BlockPercentageBar.vue';
import ScoreBadge from './ScoreBadge.vue';
import debounce from 'lodash/debounce';
import {
  PRODUCT_NAME,
  PAGE,
} from '@sbomscanner/types';

export default {
  name:       'SevereVulnerabilitiesItem',
  components: {
    ScoreBadge,
    BlockPercentageBar
  },
  props: {
    vulnerability: {
      type:     Object,
      required: true
    },
  },
  data() {
    return {
      PRODUCT_NAME,
      PAGE,
    };
  },
  methods: {
    resize(fn) {
      window.addEventListener('resize', debounce(fn), 500);
    },
  }
};
</script>

<style lang="scss" scoped>
  .vulnerability-record {
    display: grid;
    grid-template-columns: 1fr 0.75fr 1.25fr;
    padding: 4px 0;
    align-items: center;
    align-self: stretch;
    max-height: 28px;

    .cve {
      display: flex;
      padding: 0 16px;
      align-items: flex-start;
      gap: 8px;
    }

    .impacted-container {
      display: flex;
      padding: 0 16px;
      align-items: center;
      justify-content: end;
      min-width: 230px;
    }

    .impacted {
      display: flex;
      align-items: center;
      justify-content: end;
      gap: 16px;
      flex: 1 0 0;
      align-self: stretch;

      .percentage-bar {
        width: 158px;
      }
    }
  }
</style>
