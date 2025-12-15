<template>
  <div
    ref="trigger"
    class="text-with-pop"
    @mouseenter="checkPosition"
  >
    <span style="margin-left: 8px;">{{ value }}</span>
    <div
      class="message-hover-overlay"
      :class="{ 'show-top': showOnTop }"
    >
      <div class="title">
        {{ detail.title }}
      </div>
      <div class="message-wrap">
        <div
          v-if="getStatusDotClass"
          :class="getStatusDotClass"
        ></div>
        <div class="message">
          {{ detail.message }}
        </div>
      </div>
    </div>
  </div>
</template>
<script>

export default {
  name:  'TextWithPoppedDetail',
  props: {
    value: {
      type:    String,
      default: ''
    },
    detail: {
      type:    Object,
      default: () => ({})
    }
  },
  data() {
    return { showOnTop: false };
  },
  methods: {
    checkPosition() {
      const trigger = this.$refs.trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      this.showOnTop = (viewportHeight - trigger.bottom < 300);
    }
  },
  computed: {
    getStatusDotClass() {
      if (this.detail.type === 'error') {
        return 'dot failed';
      } else {
        return '';
      }
    }
  },
};
</script>

<style lang="scss" scoped>
  @import '../../styles/_variables.scss';

   .message-hover-overlay {
        position: absolute;
        top: calc(100% + 10px);
        right: 10px;
        background: var(--popover-bg);
        border: 1px solid var(--popover-border);
        padding: 16px;
        z-index: 100;
        width: 360px;
        word-wrap: break-word;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        .title {
            font-weight: bold;
            font-size: 16px;
            color: var(--text-primary);
            margin-bottom: 12px;
        }
        .message {
            color: var(--text-secondary);
            font-size: 14px;

            white-space: pre-wrap;
            word-break: break-word;
        }
    }
    .message-hover-overlay.show-top {
        top: auto;
        bottom: calc(100% + 10px);
        margin-bottom: 8px;
    }
    .text-with-pop {
      color: var(--text-error);
      cursor: pointer;
      position: relative;
      display: inline-block;
      &:hover .message-hover-overlay {
        display: block;
      }
      /* Define CSS variables on the root element of this component */
      --status-pending: #{$pending-color};
      --status-scheduled: #{$scheduled-color};
      --status-inprogress: #{$inprogress-color};
      --status-complete: #{$completed-color};
      --status-failed: #{$failed-color};
      --status-none: #FFFFFF;

      .message-hover-overlay {
        display: none;
      }
      text-decoration: underline;
    }
    .message-wrap {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        .dot {
            width: 8px;
            height: 8px;
            margin-top: 4px;
            min-width: 8px;
            border-radius: 50%;
            border-width: 1px;
            border-style: solid;
            &.pending {
                background-color: var(--status-pending);
                border-color: var(--status-pending);
            }
            &.scheduled {
                background-color: var(--status-scheduled);
                border-color: var(--status-scheduled);
            }
            &.inprogress {
                background-color: var(--status-inprogress);
                border-color: var(--status-inprogress);
            }
            &.complete {
                background-color: var(--status-complete);
                border-color: var(--status-complete);
            }
            &.failed {
                background-color: var(--status-failed);
                border-color: var(--status-failed);
            }
            &.none {
                background-color: var(--status-none);
                border-color: #DCDEE4;
            }
        }
        .message {
            color: var(--text-secondary);
            font-size: 14px;
            word-break: break-word;
        }
    }

</style>
