<script>
import isEmpty from 'lodash/isEmpty';

import { get } from '@shell/utils/object';

export default {
  props: {
    reference: {
      type:    String,
      default: null,
    },

    row: {
      type:     Object,
      required: true
    },

    value: {
      type:     String,
      default: ''
    }
  },

  async created() {
    this.deployment = await this.row.matchingDeployment();
  },

  data() {
    return { deployment: null };
  },

  computed:   {
    hasErrors() {
      const out = this.flattenedConditions?.filter((condition) => condition.error);

      return !isEmpty(out);
    },

    flattenedConditions() {
      return this.deployment?.flatMap((dep) => dep.status.conditions);
    },

    formattedConditions() {
      if (this.hasErrors) {
        const errorConditions = this.flattenedConditions.filter((condition) => condition.error);
        const formattedTooltip = [];

        errorConditions?.forEach((c) => {
          formattedTooltip.push(`<p><b>${ [c.type] }</b>: ${ c.message }</p>`);
        });

        return formattedTooltip.toString().replaceAll(',', '');
      }

      return false;
    },

    to() {
      if (this.row && this.reference) {
        return get(this.row, this.reference);
      }

      return this.row?.detailLocation;
    },
  },

};

</script>
<template>
  <span class="deployment">
    <router-link v-if="to" :to="to">
      {{ value }}
    </router-link>
    <span v-else>{{ value }}</span>
    <i
      v-if="hasErrors"
      v-clean-tooltip="{ content: `<div>${ formattedConditions }</div>`, html: true }"
      class="conditions-alert-icon icon-error icon-lg"
    />
  </span>
</template>

<style lang="scss" scoped>
  .deployment {
    display: flex;
    align-items: center;
  }

  .conditions-alert-icon {
    color: var(--error);
    margin-left: 4px;
  }

  :deep(.labeled-tooltip, .status-icon) {
    position: relative;
    display: inline;
    left: auto;
    right: auto;
    top: 2px;
    bottom: auto;
  }
</style>
