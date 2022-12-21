<script>
export default {
  name: 'DashboardCard',

  props: {
    card: {
      type:     Object,
      required: true
    }
  },

  computed: {
    setLoading() {
      return !this.card?.isLoaded ? 'loading' : '';
    },
  },
};
</script>

<template>
  <div v-if="!card.isLoaded" :class="setLoading">
    <i class="icon-spinner animate-spin" />
  </div>
  <div
    v-else
    class="d-main"
    :class="setLoading"
  >
    <div class="d-header">
      <i class="icon icon-fw" :class="card.icon" />
      <n-link :to="card.link">
        <h1>
          {{ t(card.title) }}
        </h1>
      </n-link>
    </div>

    <p v-html="t(card.description)" />

    <n-link class="btn role-secondary" :to="card.cta">
      {{ t(card.linkText) }}
    </n-link>

    <hr>

    <div class="d-slot">
      <h2>{{ t(card.slotTitle) }}</h2>
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.d-main, .loading  {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: $space-m;
  grid-auto-rows: 1fr;
  gap: $space-m;
  outline: 1px solid var(--border);
  border-radius: var(--border-radius);

  // Header's style
  .d-header {
    display: flex;
    align-items: center;

    i {
      margin: 5px 10px 0 0 ;
      width: auto;
      text-decoration: none;
    }

    h1 {
      margin: 0;
      font-size: 18px;
    }
  }

  p {
    min-height: 48px;
  }

  .d-slot {
    width: 100%;
    display: flex;
    flex-direction: column;

    h2 {
      min-height: 18px;
      font-size: 16px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: $space-s;

      li, .link {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        font-size: 14px;
        &:not(:last-child) {
          border-bottom: 1px solid var(--border);
          padding-bottom: $space-s;
        }
      }

      li > .disabled {
        color: var(--disabled-text);
      }

      .disabled {
        cursor: not-allowed;
      }
    }
  }
}
.loading {
  min-height: 325px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  place-content: center;

  .animate-spin {
    opacity: 0.5;
    font-size: 24px;
    animation: spin 5s linear infinite;
  }

  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
