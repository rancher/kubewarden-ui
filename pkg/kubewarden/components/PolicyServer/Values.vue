<script>
import { _CREATE } from '@shell/config/query-params';

import Loading from '@shell/components/Loading';
import Tabbed from '@shell/components/Tabbed';

export default {
  name: 'Values',

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    chartValues: {
      type:     Object,
      default:  () => {}
    },

    value: {
      type:     Object,
      required: true
    }
  },

  components: { Loading, Tabbed },

  async fetch() {
    if ( !this.isCreate && this.value ) {
      this.configValues = { questions: this.value };
    }

    try {
      await this.loadValuesComponent();
    } catch (e) {
      console.error(`Error loading values component: ${ e }`); // eslint-disable-line no-console
    }
  },

  data() {
    return {
      configValues:        null,
      showQuestions:       true,
      showValuesComponent: false,
      valuesComponent:     null
    };
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    componentValue() {
      return this.isCreate ? this.chartValues : this.configValues;
    }
  },

  methods: {
    async loadValuesComponent() {
      if ( this.value.haveComponent('kubewarden/policy-server') ) {
        this.valuesComponent = this.value.importComponent('kubewarden/policy-server');
        await this.valuesComponent();

        this.showValuesComponent = true;
      }
    },

    tabChanged() {
      window.scrollTop = 0;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else class="scroll__container">
    <div class="scroll__content">
      <Tabbed
        ref="tabs"
        :side-tabs="true"
        class="step__values__content"
        @changed="tabChanged($event)"
      >
        <component
          :is="valuesComponent"
          v-model="componentValue"
          :resource="value"
          :mode="mode"
        />
      </Tabbed>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $padding: 5px;
  $height: 110px;
  $side: 15px;
  $margin: 10px;
  $logo: 60px;

  ::v-deep .step-container {
    height: auto;
  }

  .step {
    &__basic {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow-x: hidden;

      .spacer {
        line-height: 2;
      }
    }

    &__values {
      &__controls {
        display: flex;
        margin-bottom: 15px;

        & > *:not(:last-of-type) {
          margin-right: $padding * 2;
        }

        &--spacer {
          flex: 1
        }

      }

      &__content {
        flex: 1;

        ::v-deep .tab-container {
          overflow: auto;
        }
      }
    }
  }
</style>
