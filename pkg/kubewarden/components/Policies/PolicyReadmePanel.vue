<script setup lang="ts">
import { ref } from 'vue';
import { useStore } from 'vuex';

import ChartReadme from '@shell/components/ChartReadme';

import { PolicyDetail } from '@kubewarden/types';

const props = defineProps<{ policyChartDetails: PolicyDetail }>();

const store = useStore();
const showSlideIn = ref(false);
const t = store.getters['i18n/t'];

const show = () => {
  showSlideIn.value = true;
};

const hide = () => {
  showSlideIn.value = false;
};

defineExpose({
  show,
  hide,
});
</script>

<template>
  <div
    class="policy-info-panel"
    :style="`--banner-top-offset: 0px`"
  >
    <div
      v-if="showSlideIn"
      class="glass"
      data-testid="extension-details-bg"
      @click="hide"
    />
    <div
      class="slideIn"
      data-testid="extension-details"
      :class="{'hide': false, 'slideIn__show': showSlideIn}"
    >
      <div class="slideIn__header">
        <div
          v-if="props.policyChartDetails"
          class="policy-info-content"
        >
          <div class="policy-header pb-10">
            <div class="slideIn__header__buttons">
              <button class="btn btn-sm role-link" @click="hide">
                <span>{{ t('generic.close') }}</span>
                <i class="icon icon-chevron-right" />
              </button>
            </div>
          </div>

          <div class="policy-title mt-20">
            <h2 class="policy-info-title">
              {{ policyChartDetails.chart.annotations?.['kubewarden/displayName'] || policyChartDetails.chart.name }}
            </h2>
          </div>

          <ChartReadme class="mt-20" :version-info="policyChartDetails" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.btn-sm) {
  padding: 0 7px 0 0;
}

.policy-info-panel {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2;
  overflow-y: auto;

  $slideout-width: 35%;
  $title-height: 50px;
  $padding: 5px;
  $slideout-width: 45%;
  --banner-top-offset: 0;
  $header-height: calc(54px + var(--banner-top-offset));

  .glass {
    position: fixed;
    top: $header-height;
    height: calc(100% - $header-height);
    left: 0;
    width: 100%;
    opacity: 0;
    overflow-y: auto;
  }

  .slideIn {
    border-left: var(--header-border-size) solid var(--header-border);
    position: fixed;
    top: $header-height;
    right: -$slideout-width;
    height: calc(100% - $header-height);
    background-color: var(--topmenu-bg);
    width: $slideout-width;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    box-shadow: -3px 0 5px rgba(0, 0, 0, 0.1);

    padding: 10px;

    transition: right .5s ease;

    &__header {
      text-transform: capitalize;
    }

    .policy-info-content {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    h3 {
      font-size: 14px;
      margin: 0;
      opacity: 0.7;
      text-transform: uppercase;
    }

    .policy-header {
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;

      .policy-title {
        flex: 1;
      }
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      &__buttons {
        display: flex;
        align-items: center;
      }

      &__button {
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        > i {
          font-size: 20px;
          opacity: 0.5;
        }

        &:hover {
          background-color: var(--wm-closer-hover-bg);
        }
      }
    }

    &__show {
      right: 0;
    }
  }
}
</style>
