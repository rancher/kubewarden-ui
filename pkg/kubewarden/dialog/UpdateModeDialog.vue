<script>
import AsyncButton from '@shell/components/AsyncButton';

import { Banner } from '@components/Banner';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

export default {
  props: {
    resources: {
      type:     [Array, Object],
      required: true
    }
  },

  components: {
    AsyncButton, Banner, Checkbox
  },

  data() {
    return {
      errors:          [],
      updateToProtect: false
    };
  },

  computed: {
    policy() {
      return this.resources[0];
    },

    modeDisabled() {
      return this.policy?.spec?.mode === 'protect';
    },
  },

  methods: {
    close() {
      this.errors = [];

      this.$emit('close');
    },

    async updateMode(btnCb) {
      this.errors = [];

      try {
        this.$set(this.policy.spec, 'mode', 'protect');
        await this.policy.save();

        btnCb(true);
        this.close();
      } catch (err) {
        this.errors.push(err);
        btnCb(false);
      }
    }
  }
};
</script>

<template>
  <div
    class="p-10"
    :show-highlight-border="false"
  >
    <h4
      slot="title"
      class="text-default-text mb-10"
    >
      {{ t('kubewarden.policyConfig.mode.update.title') }}
    </h4>
    <div
      slot="body"
      class="pl-10 pr-10 mb-20 dialog-body"
    >
      <p class="mb-20">
        {{ t('kubewarden.policyConfig.mode.update.body') }}
      </p>
      <Checkbox
        v-model="updateToProtect"
        :disabled="modeDisabled"
        :label="t('kubewarden.policyConfig.mode.update.checkbox')"
      />
      <Banner v-if="updateToProtect" color="warning" :label="t('kubewarden.policyConfig.mode.warning')" />
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err.message"
      />
    </div>
    <div
      slot="actions"
      class="buttons mt-10"
    >
      <div class="right">
        <button
          class="btn role-secondary mr-10"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton mode="edit" :disabled="!updateToProtect" @click="updateMode" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dialog-body {
  display: flex;
  flex-direction: column;
}
</style>
