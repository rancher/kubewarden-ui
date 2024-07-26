<script>
import Bar from '@shell/components/graph/Bar';

export default {
  props:      {
    events: {
      type:     Object,
      required: true
    }
  },

  components: { Bar },

  computed: {
    percentageBarValue() {
      if ( !this.events.total ) {
        return 0;
      }

      return ( Math.round(this.events.status.success * 100 ) / this.events.total );
    }
  },

  methods: {
    formattedPercentage(type) {
      return `${ Math.round(this.events.status[type] * 100) / this.events.total }%`;
    }
  }
};
</script>

<template>
  <div class="events-gauge">
    <div class="numbers">
      <div class="numbers-stats success">
        <span class="text-success">{{ events.status.success }}</span>
        <span>Success</span>
        <span class="percentage"><i>/&nbsp;</i>{{ formattedPercentage('success') }}</span>
      </div>

      <div class="numbers-stats fail">
        <span class="text-error">{{ events.status.fail }}</span>
        <span>Fail</span>
        <span class="percentage"><i>/&nbsp;</i>{{ formattedPercentage('fail') }}</span>
      </div>
    </div>
    <div class="mt-10">
      <Bar
        :percentage="percentageBarValue"
        primary-color="--success"
        secondary-color="--error"
      />
    </div>
  </div>
</template>

<style lang="scss">
.events-gauge {
  .numbers {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;

    &-stats {
      display: flex;
      flex-direction: row;
      align-items: center;
      align-self: baseline;
      font-size: 12px;
      gap: 4px;
    }

    .percentage {
      i {
        margin-right: 4px;
      }
    }
  }
}
</style>
