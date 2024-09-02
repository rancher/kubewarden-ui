<script>
export default {
  props: {
    percentages: {
      type:     Array,
      required: true,
      validator(value) {
        return value.reduce((acc, val) => acc + val, 0) <= 100;
      },
    },
    colors: {
      type:     Array,
      default: () => ['--success', '--error', '--warning']
    },
  },
  computed: {
    sliceStyles() {
      let accumulatedPercentage = 0;
      const allZero = this.percentages.every(percentage => percentage === 0);

      if ( allZero ) {
        return [
          {
            width:           '100%',
            backgroundColor: 'var(--disabled-bg)',
            left:            '0%',
          },
        ];
      }

      return this.percentages.map((percentage, index) => {
        const style = {
          width:           `${ percentage }%`,
          backgroundColor: `var(${ this.colors[index] })`,
          left:            `${ accumulatedPercentage }%`,
        };

        accumulatedPercentage += percentage;

        return style;
      });
    },
  },
};
</script>

<template>
  <div class="bar">
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
  $height: 15px;

  width: 100%;
  height: $height;
  border-radius: math.div($height, 2);
  overflow: hidden;
  position: relative;

  .slice {
    position: absolute;
    top: 0;
    bottom: 0;
    height: 100%;
  }
}
</style>
