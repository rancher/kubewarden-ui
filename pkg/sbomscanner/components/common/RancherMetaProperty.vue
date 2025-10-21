<template>
  <div class="property">
    <div v-if="property.type === 'text'" class="text">
      <div v-if="property.label" class="label">
        {{ property.label }}
      </div>
      <div v-if="property.value !== null" class="value">
        {{ property.value }}
      </div>
    </div>
    <div v-if="property.type === 'link'" class="text">
      <div v-if="property.label" class="label">
        {{ property.label }}
      </div>
      <div v-if="property.value !== null" class="link">
        {{ property.value }}
      </div>
    </div>
    <div v-else-if="property.type === 'tags'" class="tags">
      <div class="tags">
        <div v-for="tag in property.tags" :key="tag" class="tag">
          <span class="tag-text">{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { MetadataProperty } from '@pkg/types';
import { PropType } from 'vue';

export default {
  name: 'RancherMetaProperty',
  props: {
    property: {
      type: Object as PropType<MetadataProperty>,
      required: true
    }
  }
}
</script>

<style lang="scss" scoped>
  .property {
    padding-right: 16px;
    gap: 4px;
    flex: 1 0 0;
  }

  .text {
    display: flex;
    align-items: flex-start;
    align-self: stretch;
    
    /* typography */
    font-family: Lato;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 21px; /* 150% */

    .label {
      display: flex;
      width: 144px;
      align-items: center;
      gap: 8px;
      /* typography */
      color: var(--disabled-text);
    }

    .value {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1 0 0;
      /* typography */
    }

    .link {
      color: #5696ce;
      text-decoration: none;
      :hover {
        text-decoration: underline;
      }
    }
  }

  

  .tags {
    display: flex;
    align-items: flex-start;
    align-content: flex-start;
    gap: 8px;
    align-self: stretch;
    flex-wrap: wrap;
    /* style */
    border-radius: 4px;

    .tag {
      display: flex;
      padding: 1px 8px;
      align-items: center;
      gap: 8px;
      /* style */
      border-radius: 4px;
      background: #EDEFF3;

      .tag-text {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
        line-clamp: 1;
        /* typography */
        overflow: hidden;
        color: #141419;
        text-overflow: ellipsis;
        font-family: Lato;
        font-size: 13px;
        font-style: normal;
        font-weight: 400;
        line-height: 22px; /* 169.231% */
      }
    }
  }
</style>