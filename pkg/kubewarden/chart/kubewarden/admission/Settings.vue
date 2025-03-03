<script>
import { _VIEW } from '@shell/config/query-params';
import { saferDump } from '@shell/utils/create-yaml';

import YamlEditor from '@shell/components/YamlEditor';

export default {
  props: {
    activeTab: {
      type:    String,
      default: null
    },
    value: {
      type:     Object,
      required: true
    }
  },

  inject: ['realMode'],

  components: { YamlEditor },

  data() {
    const settingsYaml = saferDump(this.value?.policy?.spec?.settings);

    return { settingsYaml };
  },

  watch: {
    activeTab() {
      if (this.activeTab === 'settings') {
        this.$nextTick(() => {
          this.$refs.yamleditor.refresh();
        });
      }
    }
  },

  computed: {
    isView() {
      return this.realMode === _VIEW;
    },
  }
};
</script>

<template>
  <div>
    <YamlEditor
      ref="yamleditor"
      v-model:value="settingsYaml"
      data-testid="kw-policy-config-settings-yaml-editor"
      class="yaml-editor"
      initial-yaml-values="# Additional Settings YAML \n"
      :editor-mode="isView ? 'VIEW_CODE' : 'EDIT_CODE'"
      @onInput="$emit('updateSettings', $event)"
    />
  </div>
</template>
