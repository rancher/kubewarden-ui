<template>
  <div
    v-if="registryStatus.registryName"
    class="registry-status-record"
  >
    <RouterLink
      class="registry-name"
      :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${ PAGE.REGISTRIES }/${ registryStatus.namespace }/${ registryStatus.registryName }`"
    >
      {{ registryStatus.registryName }}
    </RouterLink>
    <div class="uri">
      {{ registryStatus.uri }}
    </div>
    <div class="prev-status">
      <StatusBadge :status="registryStatus.prevScanStatus" />
    </div>
    <div class="arrow">
      &gt;
    </div>
    <div class="curr-status">
      <StatusBadge :status="registryStatus.currStatus" />
    </div>
    <div class="update-time">
      {{ `${statusUpdateTime(registryStatus.lastTransitionTime)}` }}
    </div>
  </div>
  <div
    v-else
    class="registry-status-record"
  >
    <div class="no-data"></div>
  </div>
</template>

<script>
import StatusBadge from './StatusBadge';
import { elapsedTime } from '@shell/utils/time';
import {
  PRODUCT_NAME,
  PAGE,
} from '@pkg/types';
export default {
  name:       'RegistryStatusUpdate',
  components: { StatusBadge },
  props:      {
    registryStatus: {
      type:     Object,
      required: true
    }
  },
  data() {
    return {
      PRODUCT_NAME,
      PAGE,
    };
  },
  methods: {
    statusUpdateTime(lastTransitionTime) {
      return `${ elapsedTime(Math.ceil(Date.now() / 1000) - Math.ceil((new Date(lastTransitionTime).getTime() / 1000))).label } ${ this.t('imageScanner.general.ago') }`;
    }
  }
};
</script>

<style lang="scss" scoped>
    .no-data {
        color: var(--disabled-text);
        font-family: Lato;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 21px;
        min-height: 21px;
        width: 100%;
    }
    .registry-status-record {
        display: flex;
        padding: 4px 0px;
        align-items: center;
        align-self: stretch;
        .registry-name {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            flex: 6;
            overflow: hidden;
            color: #5696CE;
            text-overflow: ellipsis;
            font-family: Lato;
            font-size: 14px;
            font-style: normal;
            font-weight: 400;
            line-height: 21px;
        }
        .uri {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            flex: 10;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-all;
            font-family: Lato;
            font-size: 14px;
            font-style: normal;
            font-weight: 400;
            line-height: 21px;
            margin-right: 8px;
        }
        .prev-status {
            flex: 5;
        }
        .arrow {
            flex: 2;
            width: 16px;
            height: 16px;
            // background: url('../../assets/img/right.svg') no-repeat center center;
            // background-size: contain;
        }
        .curr-status {
            flex: 5;
        }
        .update-time {
            flex: 6;
            margin-left: 8px;
            font-family: Lato;
            font-size: 14px;
            font-style: normal;
            font-weight: 400;
            line-height: 21px;
        }
    }
</style>
