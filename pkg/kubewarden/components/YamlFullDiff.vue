<script>
import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-slim.js';
import { createPatch } from 'diff';

export default {
  name: 'YamlFullDiff',

  props: {
    filename: {
      type:    String,
      default: '.yaml',
    },

    sideBySide: {
      type:    Boolean,
      default: false,
    },

    orig: {
      type:     String,
      required: true,
    },

    neu: {
      type:     String,
      required: true,
    }
  },

  mounted() {
    this.draw();
  },

  watch: {
    sideBySide() {
      this.draw();
    },

    orig() {
      this.draw();
    },

    neu() {
      this.draw();
    }
  },

  methods: {
    draw() {
      const targetElement = this.$refs.root;

      if (!targetElement) {
        return;
      }

      const orig = this.orig || '';
      const neu = this.neu || '';

      // Force full-document diff context so compare mirrors the complete YAML editor content.
      const context = Math.max(orig.split('\n').length, neu.split('\n').length) + 10;
      const patch = createPatch(this.filename, orig, neu, '', '', { context });
      const configuration = {
        synchronisedScroll: true,
        outputFormat:       this.sideBySide ? 'side-by-side' : 'line-by-line',
        drawFileList:       false,
        matching:           'words',
      };

      targetElement.innerHTML = '';

      const diff2htmlUi = new Diff2HtmlUI(targetElement, patch, configuration);

      diff2htmlUi.draw();
    }
  }
};
</script>

<template>
  <div
    ref="root"
    class="root"
  />
</template>

<style scoped lang="scss">
@import 'node_modules/diff2html/bundles/css/diff2html.min.css';

.root {
  max-width: 100%;
  overflow: auto;
}
</style>
