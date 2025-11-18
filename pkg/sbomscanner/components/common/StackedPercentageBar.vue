<script>
export default {
  name:  'StackedPercentageBar',
  props: {
    percentages: {
      type:     Array,
      required: true,
      validator(value) {
        return value.reduce((curr, sum) => sum + curr, 0) <= 100;
      }
    },
    primaryClasses: {
      type:    Array,
      default: () => [],
    },
    secondaryColor: {
      type:    String,
      default: () => '--border'
    },
    height: {
      type:    Number,
      default: 15
    }
  },
  computed: {
    indicatorStyle() {
      return this.percentages.map((percentage) => {
        return {
          width:  `${ percentage }%`,
          height: `${ this.height }px`,
        };
      });
    },
    barStyle() {
      return {
        backgroundColor: `var(${ this.secondaryColor })`,
        height:          `${ this.height }px`,
        borderRadius:    `${ this.height / 2 }px`,
      };
    },
  }
};
</script>

<template>
  <div
    class="bar"
    :style="barStyle"
  >
    <div
      v-for="(_, index) in percentages"
      :key="index"
      class="indicator"
      :class="primaryClasses[index]"
      :style="indicatorStyle[index]"
    />
  </div>
</template>

<style lang="scss" scoped>
.bar {
    width: 100%;
    overflow: hidden;
    position: relative;

    .indicator {
      float: left;
      height: 100%;
    }
}
</style>
