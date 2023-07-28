import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import { KUBEWARDEN } from '@kubewarden/types';

import Rules from '@kubewarden/chart/kubewarden/admission/Rules';
import Rule from '@kubewarden/chart/kubewarden/admission/Rules/Rule.vue';

import policyConfig from '../../templates/policyConfig';

describe('component: Rules', () => {
  it('rules should render rule components based on policy config', async() => {
    const wrapper = shallowMount(Rules as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      data() {
        return { rules: policyConfig.spec.rules };
      },
      propsData: { value: { policy: policyConfig } },
      provide:   { chartType: KUBEWARDEN.ADMISSION_POLICY },
      computed:  {
        currentProduct: () => {
          return { inStore: 'cluster' };
        },
        apiGroups: () => []
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentStore:               () => 'current_store',
            'current_store/all':        jest.fn(),
            'i18n/t':                   jest.fn()
          },
        }
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.findAllComponents(Rule).at(0).props().value).toStrictEqual(policyConfig.spec.rules[0] as Object);
    expect(wrapper.findAllComponents(Rule).at(1).props().value).toStrictEqual(policyConfig.spec.rules[1] as Object);
    expect(wrapper.findAllComponents(Rule).at(2).props().value).toStrictEqual(policyConfig.spec.rules[2] as Object);
    expect(wrapper.findAllComponents(Rule).at(3).props().value).toStrictEqual(policyConfig.spec.rules[3] as Object);
  });
});
