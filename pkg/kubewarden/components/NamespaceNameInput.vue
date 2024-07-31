<script>
import { mapGetters, mapActions } from 'vuex';
import { get, set } from '@shell/utils/object';
import { sortBy } from '@shell/utils/sort';
import { NAMESPACE } from '@shell/config/types';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { _VIEW, _EDIT, _CREATE } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { normalizeName } from '@shell/utils/kube';

export default {
  name:       'NameNsDescription',
  components: {
    LabeledInput,
    LabeledSelect,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
    nameEditable: {
      type:    Boolean,
      default: false,
    },
    nameDisabled: {
      type:    Boolean,
      default: false,
    },
    nameRequired: {
      type:    Boolean,
      default: true,
    },
    namespaceFilter:   { type: Function, default: null },
    namespaceMapper:   { type: Function, default: null },
    namespaceDisabled: {
      type:    Boolean,
      default: false,
    },
    namespaceNewAllowed: {
      type:    Boolean,
      default: false,
    },
    noDefaultNamespace: {
      type:    Boolean,
      default: false
    },
    /**
     * Use these objects instead of namespaces
     */
    namespacesOverride: {
      type:    Array,
      default: null,
    },
    /**
     * User these namespaces instead of determining list within component
     */
    namespaceOptions: {
      type:    Array,
      default: null,
    },
    createNamespaceOverride: {
      type:    Boolean,
      default: false,
    },
    // Use specific fields on the value instead of the normal metadata locations
    nameKey: {
      type:    String,
      default: null,
    },
    namespaceKey: {
      type:    String,
      default: null,
    },
    forceNamespace: {
      type:    String,
      default: null,
    },
    rules: {
      default: () => ({
        namespace:   [],
        name:        [],
        description: []
      }),
      type: Object,
    }
  },

  data() {
    const v = this.value;
    const metadata = v.metadata;
    let namespace, name, description;

    if (this.nameKey) {
      name = get(v, this.nameKey);
    } else {
      name = metadata?.name;
    }

    if (this.forceNamespace) {
      namespace = this.forceNamespace;
      this.updateNamespace(namespace);
    } else if (this.namespaceKey) {
      namespace = get(v, this.namespaceKey);
    } else {
      namespace = metadata?.namespace;
    }

    if (!namespace && !this.noDefaultNamespace) {
      namespace = this.$store.getters['defaultNamespace'];
      if (metadata) {
        metadata.namespace = namespace;
      }
    }

    if (this.descriptionKey) {
      description = get(v, this.descriptionKey);
    } else {
      description = metadata?.annotations?.[DESCRIPTION];
    }

    const inStore = this.$store.getters['currentStore']();
    const nsSchema = this.$store.getters[`${ inStore }/schemaFor`](NAMESPACE);

    return {
      namespace,
      name,
      description,
      createNamespace: false,
      nsSchema
    };
  },

  computed: {
    ...mapGetters(['currentProduct', 'currentCluster', 'namespaces', 'allowedNamespaces']),
    ...mapActions('cru-resource', ['setCreateNamespace']),
    namespaceReallyDisabled() {
      return (
        !!this.forceNamespace || this.namespaceDisabled || this.mode === _EDIT
      ); // namespace is never editable
    },

    nameReallyDisabled() {
      return this.nameDisabled || (this.mode === _EDIT && !this.nameEditable);
    },

    /**
     * Map namespaces from the store to options, adding divider and create button
     */
    options() {
      let namespaces;

      if (this.namespacesOverride) {
        // Use the resources provided
        namespaces = this.namespacesOverride;
      } else if (this.namespaceOptions) {
        // Use the namespaces provided
        namespaces = (this.namespaceOptions.map(ns => ns.name) || []).sort();
      } else {
        // Determine the namespaces
        const namespaceObjs = this.isCreate ? this.allowedNamespaces() : this.namespaces();

        namespaces = Object.keys(namespaceObjs);
      }

      const options = namespaces
        .map(namespace => ({ nameDisplay: namespace, id: namespace }))
        .map(this.namespaceMapper || (obj => ({
          label: obj.nameDisplay,
          value: obj.id,
        })));

      const sortedByLabel = sortBy(options, 'label');

      if (this.forceNamespace) {
        sortedByLabel.unshift({
          label: this.forceNamespace,
          value: this.forceNamespace,
        });
      }

      const createButton = {
        label: this.t('namespace.createNamespace'),
        value: '',
        kind:  'highlighted'
      };
      const divider = {
        label:    'divider',
        disabled: true,
        kind:     'divider'
      };

      const createOverhead = this.canCreateNamespace || this.createNamespaceOverride ? [createButton, divider] : [];

      return [
        ...createOverhead,
        ...sortedByLabel
      ];
    },

    isView() {
      return this.mode === _VIEW;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    canCreateNamespace() {
      // Check if user can push to namespaces... and as the ns is outside of a project restrict to admins and cluster owners
      return (this.nsSchema?.collectionMethods || []).includes('POST') && this.currentCluster?.canUpdate;
    }
  },

  watch: {
    name(val) {
      if (this.normalizeName) {
        val = normalizeName(val);
      }

      if (this.nameKey) {
        set(this.value, this.nameKey, val);
      } else {
        this.$set(this.value.metadata, 'name', val);
      }
      this.$emit('change');
    },

    namespace(val) {
      this.updateNamespace(val);
      this.$emit('change');
    },
  },

  mounted() {
    this.$nextTick(() => {
      if (this.$refs.name) {
        this.$refs.name.focus();
      }
    });
  },

  methods: {
    updateNamespace(val) {
      if (this.forceNamespace) {
        val = this.forceNamespace;
      }

      this.$emit('isNamespaceNew', !val || (this.options && !this.options.find(n => n.value === val)));

      if (this.namespaceKey) {
        set(this.value, this.namespaceKey, val);
      } else {
        this.value.metadata.namespace = val;
      }
    },

    changeNameAndNamespace(e) {
      this.name = (e.text || '').toLowerCase();
      this.namespace = e.selected;
    },

    cancelCreateNamespace(e) {
      this.createNamespace = false;
      this.$parent.$emit('createNamespace', false);
      // In practice we should always have a defaultNamespace... unless we're in non-kube extension world,  so fall back on options
      this.namespace = this.$store.getters['defaultNamespace'] || this.options.find(o => !!o.value)?.value;
    },

    selectNamespace(e) {
      if (!e || e.value === '') { // The blank value in the dropdown is labeled "Create a New Namespace"
        this.createNamespace = true;
        this.$store.dispatch(
          'cru-resource/setCreateNamespace',
          true,
        );
        this.$emit('isNamespaceNew', true);
        this.$nextTick(() => this.$refs.namespace.focus());
      } else {
        this.createNamespace = false;
        this.$store.dispatch(
          'cru-resource/setCreateNamespace',
          false,
        );
        this.$emit('isNamespaceNew', false);
      }
    },
  },
};
</script>

<template>
  <div class="row mb-20">
    <div
      v-if="createNamespace"
      data-testid="namespace-create"
      class="col span-4"
    >
      <LabeledInput
        ref="namespace"
        v-model="namespace"
        :label="t('namespace.label')"
        :placeholder="t('namespace.createNamespace')"
        :disabled="namespaceReallyDisabled"
        :mode="mode"
        :min-height="30"
        :required="nameRequired"
        :rules="rules.namespace"
      />
      <button
        aria="Cancel create"
        @click="cancelCreateNamespace"
      >
        <i
          v-clean-tooltip="t('generic.cancel')"
          class="icon icon-close align-value"
        />
      </button>
    </div>
    <div
      v-if="!createNamespace"
      data-testid="namespace"
      class="col span-4"
    >
      <LabeledSelect
        v-show="!createNamespace"
        v-model="namespace"
        :clearable="true"
        :options="options"
        :disabled="namespaceReallyDisabled"
        :searchable="true"
        :mode="mode"
        :multiple="false"
        :label="t('namespace.label')"
        :placeholder="t('namespace.selectOrCreate')"
        :rules="rules.namespace"
        required
        @selecting="selectNamespace"
      />
    </div>

    <div
      data-testid="name"
      class="col span-8"
    >
      <LabeledInput
        ref="name"
        key="name"
        v-model="name"
        :label="t('nameNsDescription.name.label')"
        :placeholder="t('nameNsDescription.name.placeholder')"
        :disabled="nameReallyDisabled"
        :mode="mode"
        :min-height="30"
        :required="nameRequired"
        :rules="rules.name"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
button {
  all: unset;
  height: 0;
  position: relative;
  top: -35px;
  float: right;
  margin-right: 7px;

  cursor: pointer;

  .align-value {
    padding-top: 7px;
  }
}

.row {
  &.name-ns-description {
    max-height: $input-height;
  }

  .namespace-select ::v-deep {
    .labeled-select {
      min-width: 40%;

      .v-select.inline {
        &.vs--single {
          padding-bottom: 2px;
        }
      }
    }
  }

  &.flip-direction {
    flex-direction: column;

    &.name-ns-description {
      max-height: initial;
    }

    &>div>* {
      margin-bottom: 20px;
    }
  }

}
</style>
