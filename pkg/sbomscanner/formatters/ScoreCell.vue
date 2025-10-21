<template>
  <div style="padding-right: 12px;">
    <ScoreBadge
      v-if="row.score && row.score.trim()"
      :score="parseFloat(row.score.split(' ')[0])"
      :score-type="row.score.split(' ')[1].replace(/[()]/g, '')"
      :severity="row.severity"
    />
    <span
      v-else
      class="na-badge"
    >n/a</span>
  </div>
</template>

<script>
import ScoreBadge from '../components/common/ScoreBadge.vue';

export default {
  name:       'ScoreCell',
  components: { ScoreBadge },
  props:      {
    row: {
      type:     Object,
      required: true
    }
  }
};
</script>

<style scoped>
.na-badge {
  display: inline-block;
  background-color: #F4F5FA;
  color: #6C6C76;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  width: 100%;
  height: 24px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
