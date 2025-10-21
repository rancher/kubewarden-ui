<template>
  <div
    ref="bar"
    class="bar-container"
  >
    <div
      v-for="n in totalBlocks"
      :key="n"
      class="block"
      :class="{ filled: n <= filledBlocks }"
    ></div>
  </div>
</template>

<script>
export default {
  name:  'BlockPercentageBar',
  props: {
    percentage: {
      type:      Number,
      required:  true,
      validator: (value) => value >= 0 && value <= 100,
    },
    eventHandler: { type: Function, default: null },
  },
  data() {
    return {
      totalBlocks:    0,
      filledBlocks:   0,
      resizeObserver: null,
    };
  },
  methods: {
    calculateBlocks() {
      const el = this.$refs.bar;

      if (!el) return;
      const width = el.offsetWidth;
      const blockWidth = 4;
      const total = Math.floor(width / blockWidth / 2);

      this.totalBlocks = total;
      this.filledBlocks = Math.round((this.percentage / 100) * total);
    },
    debounce(func, delay = 300) {
      let timeout;

      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
      };
    }
  },
  watch: {
    percentage() {
      this.calculateBlocks();
    },
  },
  mounted() {
    this.calculateBlocks();
    // window.addEventListener('resize', this.debounce(this.calculateBlocks, 500));
    this.eventHandler(this.calculateBlocks);
  },
  onBeforeUnmount() {
    // window.removeEventListener('resize', this.debounce(this.calculateBlocks, 500));
  },
  beforeUnmount() {
    // window.removeEventListener('resize', this.debounce(this.calculateBlocks, 500));
  },
};
</script>

<style scoped>
    .bar-container {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(4px, 1fr);
        gap: 3px;
        width: 100%;
        height: 16px;
    }

    .block {
        background-color: #EDEFF3;
        border-radius: 1px;
        transition: background-color 0.2s ease;
    }

    .block.filled {
        background-color: #BEC1D2;
    }
</style>
