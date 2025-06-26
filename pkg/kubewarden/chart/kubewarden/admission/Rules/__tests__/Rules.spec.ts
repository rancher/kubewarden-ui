import { shallowMount } from '@vue/test-utils';


import { KUBEWARDEN } from '@kubewarden/constants';

import Rules from '@kubewarden/chart/kubewarden/admission/Rules';
import Rule from '@kubewarden/chart/kubewarden/admission/Rules/Rule.vue';

import { userGroupPolicy } from '@tests/unit/mocks/policyConfig';

describe('component: Rules', () => {
  it('rules should render rule components based on policy config', async() => {
    const wrapper = shallowMount(Rules, {
      data() {
        return { rules: userGroupPolicy.spec.rules };
      },
      props:    { value: { policy: userGroupPolicy } },
      computed:  {
        apiGroups:         () => [],
        disabledRules:     () => false,
        namespacedGroups:  () => null,
        namespacedSchemas: () => [],
        schemas:           () => [],
        isView:            () => false
      },
      global:   {
        provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
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
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.findAllComponents(Rule).at(0)?.props().value).toStrictEqual(userGroupPolicy.spec.rules[0] as object);
    expect(wrapper.findAllComponents(Rule).at(1)?.props().value).toStrictEqual(userGroupPolicy.spec.rules[1] as object);
    expect(wrapper.findAllComponents(Rule).at(2)?.props().value).toStrictEqual(userGroupPolicy.spec.rules[2] as object);
    expect(wrapper.findAllComponents(Rule).at(3)?.props().value).toStrictEqual(userGroupPolicy.spec.rules[3] as object);
  });
});
