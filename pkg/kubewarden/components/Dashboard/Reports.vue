<script>
import { KUBEWARDEN_PRODUCT_NAME } from '@kubewarden/constants';
import { POLICY_REPORTER_PRODUCT } from '@kubewarden/types';

export default {
  props: {
    gauges: {
      type:     Object,
      required: true
    },
    showReporterLink: {
      type:     Boolean,
      default:  false
    }
  },
  data() {
    const reporterLink = {
      name:   `c-cluster-${ KUBEWARDEN_PRODUCT_NAME }-${ POLICY_REPORTER_PRODUCT }`,
      params: { product: KUBEWARDEN_PRODUCT_NAME }
    };

    return { reporterLink };
  }
};
</script>

<template>
  <div class="mb-20 reports">
    <h4 class="text-bold mb-0">
      {{ t('kubewarden.dashboard.headers.reports.title') }}:&nbsp;
    </h4>
    <span class="text-success">{{ gauges.status.success }} {{ t('kubewarden.dashboard.headers.reports.success') }}</span>
    <span>&nbsp;/&nbsp;</span>
    <span class="text-error">{{ gauges.status.fail }} {{ t('kubewarden.dashboard.headers.reports.fail') }}</span>
  </div>
</template>

<style lang="scss" scoped>
.reports {
  display: flex;
  align-items: flex-end;
}
</style>
