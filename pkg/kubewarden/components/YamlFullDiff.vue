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

:deep() .d2h-wrapper {
  .d2h-file-header {
    display: none;
  }

  .d2h-file-wrapper {
    border-color: var(--diff-border);
  }

  .d2h-diff-table {
    font-family: Menlo,Consolas,monospace;
    font-size: 13px;
  }

  .d2h-emptyplaceholder, .d2h-code-side-emptyplaceholder {
    border-color: var(--diff-linenum-border);
    background-color: var(--diff-empty-placeholder);
  }

  .d2h-code-linenumber,
  .d2h-code-side-linenumber {
    background-color: var(--diff-linenum-bg);
    color: var(--diff-linenum);
    border-color: var(--diff-linenum-border);
    border-left: 0;
  }

  .d2h-code-line del,.d2h-code-side-line del {
    background-color: var(--diff-line-del-bg);
  }

  .d2h-code-line ins,.d2h-code-side-line ins {
    background-color: var(--diff-line-ins-bg);
  }

  .d2h-del {
    background-color: var(--diff-del-bg);
    border-color: var(--diff-del-border);
    color: var(--body-text);
  }

  .d2h-ins {
    background-color: var(--diff-ins-bg);
    border-color: var(--diff-ins-border);
    color: var(--body-text);
  }

  .d2h-info {
    background-color: var(--diff-header-bg);
    color: var(--diff-header);
    border-color: var(--diff-header-border);
  }

  .d2h-file-diff .d2h-del.d2h-change {
    background-color: var(--diff-chg-del);
  }

  .d2h-file-diff .d2h-ins.d2h-change {
    background-color: var(--diff-chg-ins);
  }
}
</style>
