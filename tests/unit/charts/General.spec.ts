import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import { KUBEWARDEN } from '@kubewarden/types';
import General from '@kubewarden/chart/kubewarden/admission/General.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import policyConfig from '../templates/policyConfig';

describe('component: General', () => {
  it('should display the PolicyServer options if available', () => {
    const ps = [{ id: 'default' }, { id: 'custom-ps' }];

    const wrapper = mount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { targetNamespace: 'default', value: { policy: policyConfig } },
      provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
      computed:  {
        policyServers:       () => ps,
        policyServerOptions: () => ['default', 'custom-ps'],
        isGlobal:            () => false
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentStore:           () => 'current_store',
            'current_store/all':    jest.fn(),
            'i18n/t':               jest.fn()
          },
        }
      },
      stubs: {
        NameNsDescription: { template: '<span />' },
        RadioGroup:        { template: '<span />' },
        LabeledTooltip:    { template: '<span />' }
      }
    });
    const input = wrapper.findComponent(LabeledSelect);

    expect(input.props().value).toStrictEqual('default' as String);
    expect(input.props().options).toStrictEqual(['default', 'custom-ps'] as Array<String>);
  });
});
