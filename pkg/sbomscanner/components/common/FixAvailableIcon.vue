<template>
  <i
    :class="fixAvailable ? 'icon icon-confirmation-alt icon-fix-available' : 'icon icon-notify-error icon-fix-unavailable'"
  ></i>
</template>

<script>
export default {
  name:  'FixAvailableIcon',
  props: {
    fixAvailable: {
      type:    Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss" scoped>
  @import '../../styles/_variables.scss';

  i {
    font-size: 1.5rem;
    &.icon-fix-available {
      color: $blue;
    }
    &.icon-fix-unavailable {
      color: var(--disabled-text);
    }
  }
</style>
