import { shallowMount } from '@vue/test-utils';

import { KUBEWARDEN } from '@kubewarden/types';
import Rule from '@kubewarden/chart/kubewarden/admission/Rules/Rule.vue';

describe('component: Rule fetch defaults', () => {
  function mountRule(value: any) {
    return shallowMount(Rule, {
      propsData: {
        value,
        disabled: true,
        mode:     'create',
      },
      global: { provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY } },
    });
  }

  it('does not overwrite an explicitly empty apiGroups array', async() => {
    const value = { apiGroups: [] };
    const wrapper = mountRule(value);

    await wrapper.vm.$options.fetch.call(wrapper.vm);

    expect(value.apiGroups).toStrictEqual([]);
  });

  it('applies wildcard apiGroups only when apiGroups is unset', async() => {
    const value = {};
    const wrapper = mountRule(value);

    await wrapper.vm.$options.fetch.call(wrapper.vm);

    expect(value.apiGroups).toStrictEqual(['*']);
  });
});
