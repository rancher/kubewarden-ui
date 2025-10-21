<template>
  <div class="chart-area">
    <div class="title">
      Most affected images at risk
    </div>
    <div
      v-for="(image, index) in topRiskyImages"
      :key="index"
      class="image-record"
    >
      <RouterLink
        class="image-name"
        :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${ PAGE.IMAGES }/${ image.imageName }`"
      >
        {{ image.imageName }}
      </RouterLink>
      <AmountBarBySeverity
        class="image-cve"
        :cve-amount="image.cveCnt"
      />
    </div>
  </div>
</template>

<script>
import AmountBarBySeverity from '@pkg/components/common/AmountBarBySeverity';import {
  PRODUCT_NAME,
  PAGE,
} from '@pkg/types';
export default {
  name:       'AmountBarBySeverity',
  components: { AmountBarBySeverity },
  props:      {
    topRiskyImages: {
      type:    Array,
      default:  () => []
    }
  },
  data() {
    return {
      PRODUCT_NAME,
      PAGE,
    };
  },
};
</script>

<style lang="scss" scoped>
  .chart-area {
    display: flex;
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    flex: 1 0 0;
    border-right: 1px solid #DCDEE7;
    .title {
        color: #141419;
        font-family: Lato;
        font-size: 18px;
        font-style: normal;
        font-weight: 400;
        line-height: 21px; /* 116.667% */
    }
    .image-record {
        display: flex;
        padding: 4px 0px;
        padding: 0px 16px;
        align-items: center;
        align-self: stretch;
        .image-name {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            flex: 1 1 0;
            overflow: hidden;
            color: #5696CE;
            text-overflow: ellipsis;
            font-family: Lato;
            font-size: 14px;
            font-style: normal;
            font-weight: 400;
            line-height: 21px; /* 150% */
        }
        .image-cve {
            flex: 1 1 0;
        }
    }
  }
</style>
