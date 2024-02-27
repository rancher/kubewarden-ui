<script>
import { mapGetters } from 'vuex';

import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';

import PolicyList from '../components/Policies/PolicyList';

export default {
  components: {
    Banner, Loading, PolicyList
  },

  props: {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('cluster/findAll', { type: this.resource });
  },

  computed: {

    rows() {
      return this.$store.getters['cluster/all'](this.resource);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner
      data-testid="kw-ap-list-banner"
      class="type-banner mb-20 mt-0"
      color="info"
      :label="t('kubewarden.admissionPolicy.description')"
    />

    <PolicyList data-testid="kw-ap-policy-list" :resource="resource" :rows="rows" :schema="schema" />
  </div>
</template>
