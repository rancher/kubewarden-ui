import { shallowMount } from '@vue/test-utils';


import { KUBEWARDEN } from '@kubewarden/types';
import General from '@kubewarden/chart/kubewarden/admission/General.vue';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
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
        hasValuesModule:     () => false,
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
        hasValuesModule:     () => false,
        showModeBanner:      () => false,
        modeDisabled:        () => false
      }
    });
    const radio = wrapper.findAllComponents(RadioGroup).at(0);

    await wrapper.setData({ policy: { spec: { mode: 'protect' } } });

    expect(radio?.props().value).toStrictEqual('protect' as string);
  });

  it('should sync values-based OCI fields back into spec.module', async() => {
    const wrapper = shallowMount(General, {
      props:  {
        targetNamespace: 'default',
        value:           {
          policy: {
            ...userGroupPolicy,
            spec: {
              ...userGroupPolicy.spec,
              module: 'ghcr.io/kubewarden/old-policy:v1'
            }
          }
        },
        moduleInfo: {
          registry:   'ghcr.io',
          repository: 'kubewarden/pod-privileged',
          tag:        'v1.0.0',
          source:     'values'
        }
      },
      global: {
        provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
        mocks:   {
          $fetchState: { pending: false },
          $store:      {
            getters: {
              currentStore:        () => 'current_store',
              'current_store/all': jest.fn(),
              'i18n/t':            jest.fn()
            },
          }
        },
        stubs: {
          NameNsDescription: { template: '<span />' },
          RadioGroup:        { template: '<span />' },
          LabeledTooltip:    { template: '<span />' },
          LabeledInput:      { template: '<span />' }
        }
      },
      computed: {
        isCreate:            () => true,
        policyServers:       () => [],
        policyServerOptions: () => [],
        isGlobal:            () => true,
        hasValuesModule:     () => true,
        showModeBanner:      () => false,
        modeDisabled:        () => false
      }
    });

    await wrapper.setData({
      policyRegistry:   'registry.internal:5000',
      policyRepository: 'kubewarden/pod-privileged',
      policyTag:        'v2.0.0'
    });

    wrapper.vm.syncModule();

    expect(wrapper.vm.policy.spec.module).toBe('registry.internal:5000/kubewarden/pod-privileged:v2.0.0');
  });

  it('should render the timeoutEvalSeconds input with correct attributes', () => {
    const wrapper = shallowMount(General, {
      props:  {
        targetNamespace: 'default',
        value:           { policy: userGroupPolicy }
      },
      global:   {
        provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
        mocks:   {
          $fetchState: { pending: false },
          $store:      {
            getters: {
              currentStore:        () => 'current_store',
              'current_store/all': jest.fn(),
              'i18n/t':            jest.fn()
            },
          }
        },
        stubs: {
          NameNsDescription: { template: '<span />' },
          RadioGroup:        { template: '<span />' },
          LabeledTooltip:    { template: '<span />' }
        }
      },
      computed: {
        policyServerOptions: () => ['default'],
        isGlobal:            () => true,
        isCreate:            () => true,
        hasValuesModule:     () => false,
        showModeBanner:      () => false,
        modeDisabled:        () => false
      }
    });

    const input = wrapper.find('[data-testid="kw-policy-general-timeout-eval-seconds-input"]');

    expect(input.exists()).toBe(true);
    expect(input.attributes('type')).toBe('number');
    expect(input.attributes('min')).toBe('2');
    expect(input.attributes('max')).toBe('30');
  });

  it('should bind timeoutEvalSeconds to policy.spec.timeoutEvalSeconds', async() => {
    const wrapper = shallowMount(General, {
      props:  {
        targetNamespace: 'default',
        value:           { policy: userGroupPolicy }
      },
      global:   {
        provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
        mocks:   {
          $fetchState: { pending: false },
          $store:      {
            getters: {
              currentStore:        () => 'current_store',
              'current_store/all': jest.fn(),
              'i18n/t':            jest.fn()
            },
          }
        },
        stubs: {
          NameNsDescription: { template: '<span />' },
          RadioGroup:        { template: '<span />' },
          LabeledTooltip:    { template: '<span />' }
        }
      },
      computed: {
        policyServerOptions: () => ['default'],
        isGlobal:            () => true,
        isCreate:            () => true,
        hasValuesModule:     () => false,
        showModeBanner:      () => false,
        modeDisabled:        () => false
      }
    });

    await wrapper.setData({ policy: { spec: { timeoutEvalSeconds: 15 } } });

    const input = wrapper.find('[data-testid="kw-policy-general-timeout-eval-seconds-input"]');

    expect(input.exists()).toBe(true);
    expect((wrapper.vm as any).policy.spec.timeoutEvalSeconds).toBe(15);
  });

  it('should coerce timeoutEvalSeconds to an integer when input fires a string', async() => {
    const wrapper = shallowMount(General, {
      props:  {
        targetNamespace: 'default',
        value:           { policy: userGroupPolicy }
      },
      global:   {
        provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
        mocks:   {
          $fetchState: { pending: false },
          $store:      {
            getters: {
              currentStore:        () => 'current_store',
              'current_store/all': jest.fn(),
              'i18n/t':            jest.fn()
            },
          }
        },
        stubs: {
          NameNsDescription: { template: '<span />' },
          RadioGroup:        { template: '<span />' },
          LabeledTooltip:    { template: '<span />' }
        }
      },
      computed: {
        policyServerOptions: () => ['default'],
        isGlobal:            () => true,
        isCreate:            () => true,
        showModeBanner:      () => false,
        modeDisabled:        () => false
      }
    });

    const input = wrapper.findComponent(LabeledInput);

    await input.vm.$emit('update:value', '10');
    await wrapper.vm.$nextTick();

    expect(typeof (wrapper.vm as any).policy.spec.timeoutEvalSeconds).toBe('number');
    expect((wrapper.vm as any).policy.spec.timeoutEvalSeconds).toBe(10);
  });

  it('should set timeoutEvalSeconds to undefined when input is cleared', async() => {
    const wrapper = shallowMount(General, {
      props:  {
        targetNamespace: 'default',
        value:           { policy: userGroupPolicy }
      },
      global:   {
        provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
        mocks:   {
          $fetchState: { pending: false },
          $store:      {
            getters: {
              currentStore:        () => 'current_store',
              'current_store/all': jest.fn(),
              'i18n/t':            jest.fn()
            },
          }
        },
        stubs: {
          NameNsDescription: { template: '<span />' },
          RadioGroup:        { template: '<span />' },
          LabeledTooltip:    { template: '<span />' }
        }
      },
      computed: {
        policyServerOptions: () => ['default'],
        isGlobal:            () => true,
        isCreate:            () => true,
        showModeBanner:      () => false,
        modeDisabled:        () => false
      }
    });

    await wrapper.setData({ policy: { spec: { timeoutEvalSeconds: 10 } } });

    const input = wrapper.findComponent(LabeledInput);

    await input.vm.$emit('update:value', '');
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).policy.spec.timeoutEvalSeconds).toBeUndefined();
  });
});
