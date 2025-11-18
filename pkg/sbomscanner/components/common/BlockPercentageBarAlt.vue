<template>
  <div class="percentage-bar">
    <div
      v-for="index in filledTicks"
      :key="`filled-${index}`"
      class="percentage-bar-tick filled"
    ></div>
    <div
      v-for="index in (ticks - filledTicks)"
      :key="`unfilled-${index}`"
      class="percentage-bar-tick"
    ></div>
  </div>
</template>

<script>
export default {
  name:  'BlockPercentageBarAlt',
  props: {
    percentage: {
      type:      Number,
      required:  true,
      validator: (value) => value >= 0 && value <= 100,
    },
    ticks: {
      type:    Number,
      default: 23
    }
  },
  computed: {
    filledTicks() {
      let filledTicks = Math.floor((this.percentage / 100) * this.ticks);

      if (filledTicks < 1 && this.percentage > 0) {
        filledTicks = 1; // Ensure at least one tick is filled
      }

      return filledTicks;
    }
  }
};
</script>

<style lang="scss" scoped>
  .percentage-bar {
    display: flex;
    height: 16px;
    align-items: center;
    gap: 3px;

    .percentage-bar-tick {
      /* layout */
      display: flex;
      width: 4px;
      justify-content: space-between;
      align-items: center;
      align-self: stretch;
      /* style */
      border-radius: 1px;
      background: #F4F5FA;

      &.filled {
        background: #BEC1D2;
      }
    }
  }
</style>
