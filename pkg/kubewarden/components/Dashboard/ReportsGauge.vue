<script>
import Bar from '@shell/components/graph/Bar';

export default {
  props:      {
    reports: {
      type:     Object,
      required: true
    }
  },

  components: { Bar },

  computed: {
    percentageBarValue() {
      if (!this.reports.total) {
        return 0;
      }

      return parseFloat(((this.reports?.status.success * 100) / this.reports.total).toFixed(2));
    },

    secondaryColor() {
      return this.reports?.total === 0 ? '--border' : '--error';
    }
  },

  methods: {
    formattedPercentage(type) {
      return `${ ((Math.round(this.reports?.status[type] * 100) / this.reports.total) || 0).toFixed(0) }%`;
    }
  }
};
</script>

<template>
  <div class="reports-gauge">
    <div class="numbers">
      <div class="numbers-stats success">
        <span class="text-success">{{ reports.status.success }}</span>
        <span>Success</span>
        <span class="percentage"><i>/&nbsp;</i>{{ formattedPercentage('success') }}</span>
      </div>

      <div class="numbers-stats fail">
        <span class="text-error">{{ reports.status.fail }}</span>
        <span>Fail</span>
        <span class="percentage"><i>/&nbsp;</i>{{ formattedPercentage('fail') }}</span>
      </div>
    </div>
    <div class="mt-10">
      <Bar
        :percentage="percentageBarValue"
        primary-color="--success"
        :secondary-color="secondaryColor"
      />
    </div>
  </div>
</template>

<style lang="scss">
.reports-gauge {
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
