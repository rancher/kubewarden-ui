<script>
import Bar from '../Graph/Bar';

export default {
  props: {
    events: {
      type:     Object,
      required: true,
    },
  },

  components: { Bar },

  computed: {
    percentageValues() {
      const { success, fail, error } = this.events.status;
      const total = this.events.total || 1; // Prevent division by zero

      return [
        Math.round((success / total) * 100),
        Math.round((fail / total) * 100),
        Math.round((error / total) * 100),
      ];
    },
  },

  methods: {
    formattedPercentage(type) {
      const statusCount = this.events.status[type];
      const totalCount = this.events.total;

      if ( totalCount === 0 ) {
        return '0%';
      }

      const percentage = Math.round((statusCount * 100) / totalCount);

      return `${ percentage }%`;
    },
  },
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

      <div class="numbers-stats error">
        <span class="number">{{ events.status.error }}</span>
        <span>Error</span>
        <span class="percentage"><i>/&nbsp;</i>{{ formattedPercentage('error') }}</span>
      </div>
    </div>
    <div class="mt-10">
      <Bar
        :percentages="percentageValues"
        :colors="['--success', '--error', '--app-color4-accent']"
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

  .numbers-stats.error .number {
    color: var(--app-color4-accent);
  }
}
</style>
