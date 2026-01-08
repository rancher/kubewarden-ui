<script>
export default {
  props: {
    percentage: {
      type:     Number,
      required: true
    },
    primaryColor: {
      type:    String,
      default: '--primary'
    },
    secondaryColor: {
      type:    String,
      default: '--border'
    },
    slices: {
      type:    Array,
      default: () => []
    },
    height: {
      type:    Number,
      default: 15
    }
  },
  computed: {
    indicatorStyle() {
      return {
        width:           `${ this.percentage }%`,
        height:          `${ this.height }px`,
        backgroundColor: `var(${ this.primaryColor })`
      };
    },
    barStyle() {
      return {
        backgroundColor: `var(${ this.secondaryColor })`,
        height:          `${ this.height }px`,
        borderRadius:    `${ this.height / 2 }px`,
      };
    },
    sliceStyles() {
      return this.slices.map((slice) => ({
        left:       `${ slice }%`,
        visibility: slice < this.percentage ? 'visible' : 'hidden'
      }));
    }
  }
};
</script>

<template>
  <div
    class="bar"
    :style="barStyle"
  >
    <div
      class="indicator"
      :style="indicatorStyle"
    />
    <div
      v-for="(sliceStyle, i) in sliceStyles"
      :key="i"
      class="slice"
      :style="sliceStyle"
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

    .slice {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: var(--body-bg);
    }
}
</style>
