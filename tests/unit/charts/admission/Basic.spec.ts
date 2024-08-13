import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import { KUBEWARDEN } from '@kubewarden/types';
import Basic from '@kubewarden/chart/kubewarden/admission/Basic.vue';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import NamespaceNameInput from '@kubewarden/components/NamespaceNameInput';

import { userGroupPolicy } from '@tests/unit/_templates_/policyConfig';

describe('component: Basic', () => {
  const mockPolicy = {
    metadata: {
      name:      '',
      namespace: ''
    },
    spec: { policyServer: '' }
  };

  const factory = (propsData = {}, computed = {}, provide = {}, stubs = {}) => {
    return shallowMount(Basic, {
      propsData: { value: mockPolicy, ...propsData },
      provide:   { chartType: KUBEWARDEN.ADMISSION_POLICY, ...provide },
      computed:  {
        policyServers:       () => [],
        policyServerOptions: () => [],
        isGlobal:            () => false,
        ...computed
      },
      mocks: {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentStore:        () => 'current_store',
            'current_store/all': jest.fn(),
            'i18n/t':            (key: string) => key
          }
        }
      },
      stubs: {
        RadioGroup:         { template: '<div />' },
        NamespaceNameInput: { template: '<div />' },
        LabeledInput:       { template: '<div />' },
        LabeledSelect:      { template: '<div />' },
        ...stubs
      }
    });
  };

  it('should display the NamespaceNameInput when namespaced is true', () => {
    const wrapper = factory({ mode: 'create' }, {}, { chartType: KUBEWARDEN.ADMISSION_POLICY });

    const namespaceNameInput = wrapper.findComponent(NamespaceNameInput);

    expect(namespaceNameInput.exists()).toBe(true);
  });

  it('should not display NamespaceNameInput when namespaced is false', async() => {
    const wrapper = factory({}, { isGlobal: () => true });

    await wrapper.setData({ namespaced: false });

    const namespaceNameInput = wrapper.findComponent(NamespaceNameInput);

    expect(namespaceNameInput.exists()).toBe(false);
  });

  it('should set namespace to "default" when creating an AdmissionPolicy', () => {
    const wrapper = factory({ mode: 'create' });

    expect(wrapper.vm.policy.metadata.namespace).toBe('default');
  });

  it('should display the PolicyServer options if available', () => {
    const ps = [{ id: 'default' }, { id: 'custom-ps' }];

    const wrapper = factory(
      { mode: 'create', value: { policy: userGroupPolicy } },
      {
        policyServers:       () => ps,
        policyServerOptions: () => ['default', 'custom-ps'],
        isGlobal:            () => true
      },
      { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
      {
        LabeledSelect,
        LabeledTooltip: { template: '<div />' },
        'v-select':     { template: '<div />' }
      }
    );

    const input = wrapper.findComponent(LabeledSelect);

    expect(input.props().value).toStrictEqual('default' as String);
    expect(input.props().options).toStrictEqual(['default', 'custom-ps'] as String[]);
  });

  it('should handle isNamespaceNew correctly', async() => {
    const wrapper = factory();

    await wrapper.findComponent(NamespaceNameInput).vm.$emit('isNamespaceNew', true);

    expect(wrapper.vm.isNamespaceNew).toBe(true);
    expect(wrapper.props().value.isNamespaceNew).toBe(true);
  });
});