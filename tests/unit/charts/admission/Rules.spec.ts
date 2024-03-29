import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import { KUBEWARDEN } from '@kubewarden/types';

import Rules from '@kubewarden/chart/kubewarden/admission/Rules';
import Rule from '@kubewarden/chart/kubewarden/admission/Rules/Rule.vue';

import { userGroupPolicy } from '@tests/unit/_templates_/policyConfig';

describe('component: Rules', () => {
  it('rules should render rule components based on policy config', async() => {
    const wrapper = shallowMount(Rules as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      data() {
        return { rules: userGroupPolicy.spec.rules };
      },
      propsData: { value: { policy: userGroupPolicy } },
      provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
      computed:  { apiGroups: () => [] },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentStore:         () => 'current_store',
            'cluster/all':        jest.fn(),
            'i18n/t':             jest.fn()
          },
        }
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.findAllComponents(Rule).at(0).props().value).toStrictEqual(userGroupPolicy.spec.rules[0] as Object);
    expect(wrapper.findAllComponents(Rule).at(1).props().value).toStrictEqual(userGroupPolicy.spec.rules[1] as Object);
    expect(wrapper.findAllComponents(Rule).at(2).props().value).toStrictEqual(userGroupPolicy.spec.rules[2] as Object);
    expect(wrapper.findAllComponents(Rule).at(3).props().value).toStrictEqual(userGroupPolicy.spec.rules[3] as Object);
  });
});
