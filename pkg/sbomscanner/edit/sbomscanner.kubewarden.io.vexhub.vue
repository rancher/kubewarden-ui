<script>
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import CruResource from '@shell/components/CruResource.vue';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import CreateEditView from '@shell/mixins/create-edit-view';
import { PAGE, PRODUCT_NAME } from '@pkg/types/sbomscanner';

export default {
  name: 'CruVexHub',

  components: {
    LabeledInput,
    NameNsDescription,
    CruResource,
    Checkbox,
  },

  mixins: [CreateEditView],

  data() {
    if (!this.value.spec) {
      this.value.spec = {
        url:     '',
        enabled: true,
      };
    }

    return {
      errors: null,
      PAGE,
      PRODUCT_NAME,
    };
  },
};
</script>
<template>
  <div class="filled-height">
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="value"
      :subtypes="[]"
      :validation-passed="true"
      :errors="errors"
      :cancel-event="true"
      @error="(e) => (errors = e)"
      @finish="save"
      @cancel="done"
    >
      <NameNsDescription
        :value="value"
        :mode="mode"
        :namespaced="false"
        description-placeholder="imageScanner.vexManagement.cru.desc.placeholder"
        @update:value="$emit('input', $event)"
      />
      <div class="row">
        <div class="col span-9">
          <LabeledInput
            v-model:value="value.spec.url"
            :mode="mode"
            :label="t('imageScanner.vexManagement.cru.uri.label')"
            placeholder-key="imageScanner.vexManagement.cru.uri.placeholder"
            :required="true"
          />
        </div>
      </div>
      <div class="row mt-16">
        <Checkbox
          v-model:value="value.spec.enabled"
          :tooltip="t('imageScanner.vexManagement.cru.enable.tooltip')"
          data-testid="imageScanner-vexManagement-cru-enable-checkbox"
          class="check"
          type="checkbox"
          label-key="imageScanner.vexManagement.cru.enable.label"
          :mode="mode"
        />
      </div>
    </CruResource>
  </div>
</template>
<style lang="scss" scoped>
.mt-16 {
  margin-top: 16px;
}
</style>
