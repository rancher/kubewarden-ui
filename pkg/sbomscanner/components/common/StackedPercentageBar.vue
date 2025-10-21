<script>
export default {
  name:  'StackedPercentageBar',
  props: {
    percentages: {
      type:     Array,
      required: true,
      validator(value) {
        return value.reduce((curr, sum) => sum + curr) <= 100;
      }
    },
    primaryColors: {
      type:    Array,
      default: () => ['--primary'],
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
      return this.percentages.map((percentage, index) => {
        return {
          width:           `${ percentage }%`,
          height:          `${ this.height }px`,
          backgroundColor: this.primaryColors[index]
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
      v-for="(percentage, index) in percentages"
      :key="index"
      class="indicator"
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
        height: 100%;
    }
}
</style>
