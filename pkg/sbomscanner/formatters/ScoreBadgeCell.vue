<template>
  <ScoreBadge
    :score="value"
    score-type="v3"
  />
</template>

<script>
import ScoreBadge from '@pkg/components/common/ScoreBadge.vue';

export default {
  components: { ScoreBadge },
  props:      {
    value: {
      type:     String,
      required: true
    }
  },
};
</script>
