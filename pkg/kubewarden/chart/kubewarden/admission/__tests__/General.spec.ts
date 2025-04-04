import { shallowMount } from '@vue/test-utils';


import { KUBEWARDEN } from '@kubewarden/constants';
import General from '@kubewarden/chart/kubewarden/admission/General.vue';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RadioGroup } from '@components/Form/Radio';

import { userGroupPolicy } from '@tests/unit/mocks/policyConfig';

describe('component: General', () => {
  it('should display the PolicyServer options if available', () => {
    const ps = [{ id: 'default' }, { id: 'custom-ps' }];

    const wrapper = shallowMount(General, {
      props:  {
        targetNamespace: 'default',
        value:           { policy: userGroupPolicy }
      },
      global:   {
        provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
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
      },
      computed:  {
        isCreate:            () => true,
        policyServers:       () => ps,
        policyServerOptions: () => ['default', 'custom-ps'],
        isGlobal:            () => true,
        showModeBanner:      () => false,
        modeDisabled:        () => false
      }
    });
    const input = wrapper.findComponent(LabeledSelect);

    expect(input.props().value).toStrictEqual('default' as string);
    expect(input.props().options).toStrictEqual(['default', 'custom-ps'] as string[]);
  });

  it('monitor mode should be protect by default', async() => {
    const wrapper = shallowMount(General, {
      props:    {
        targetNamespace: 'default',
        value:           { policy: userGroupPolicy }
      },
      global:   {
        provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
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
        stubs:     {
          NameNsDescription: { template: '<span />' },
          LabeledTooltip:    { template: '<span />' },
          LabeledInput:      { template: '<span />' }
        }
      },
      computed:  {
        policyServerOptions: () => ['default', 'custom-ps'],
        isGlobal:            () => true,
        isCreate:            () => true,
        showModeBanner:      () => false,
        modeDisabled:        () => false
      }
    });
    const radio = wrapper.findAllComponents(RadioGroup).at(0);

    await wrapper.setData({ policy: { spec: { mode: 'protect' } } });

    expect(radio?.props().value).toStrictEqual('protect' as string);
  });
});
