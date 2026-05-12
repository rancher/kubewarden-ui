import { shallowMount } from '@vue/test-utils';


import { KUBEWARDEN } from '@kubewarden/types';
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

  it('in view mode splits spec.module into 3 fields', () => {
    const wrapper = shallowMount(General, {
      props:  {
        targetNamespace: 'default',
        value:           {
          policy: {
            ...userGroupPolicy,
            spec: {
              ...userGroupPolicy.spec,
              module: 'ghcr.io/kubewarden/pod-privileged:v1.2.3'
            }
          }
        },
        moduleInfo: {
          registry:   'ghcr.io',
          repository: 'kubewarden/pod-privileged',
          tag:        'v1.2.3',
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
        isCreate:            () => false,
        policyServers:       () => [],
        policyServerOptions: () => [],
        isGlobal:            () => true,
        hasValuesModule:     () => true,
        showModeBanner:      () => false,
        modeDisabled:        () => false
      }
    });

    expect(wrapper.vm.policyRegistry).toBe('ghcr.io');
    expect(wrapper.vm.policyRepository).toBe('kubewarden/pod-privileged');
    expect(wrapper.vm.policyTag).toBe('v1.2.3');
  });

  it('after user clears registry, remount keeps it empty (not restored from moduleInfo)', () => {
    // Simulates: user clears registry → syncModule writes repo:tag → YAML toggle → remount
    const wrapper = shallowMount(General, {
      props:  {
        targetNamespace: 'default',
        value:           {
          policy: {
            ...userGroupPolicy,
            spec: {
              ...userGroupPolicy.spec,
              // spec.module was rebuilt by syncModule after user cleared registry
              module: 'kubewarden/pod-privileged:v1.2.3'
            }
          }
        },
        moduleInfo: {
          registry:   'ghcr.io',
          repository: 'kubewarden/pod-privileged',
          tag:        'v1.2.3',
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
        isCreate:            () => false,
        policyServers:       () => [],
        policyServerOptions: () => [],
        isGlobal:            () => true,
        hasValuesModule:     () => true,
        showModeBanner:      () => false,
        modeDisabled:        () => false
      }
    });

    expect(wrapper.vm.policyRegistry).toBe('');
    expect(wrapper.vm.policyRepository).toBe('kubewarden/pod-privileged');
    expect(wrapper.vm.policyTag).toBe('v1.2.3');
  });

  it('after user types non-hostname registry, remount preserves it in registry (not moved to repository)', () => {
    // Simulates: user types 'asdasd' → syncModule writes asdasd/repo:tag → YAML toggle → remount
    const wrapper = shallowMount(General, {
      props:  {
        targetNamespace: 'default',
        value:           {
          policy: {
            ...userGroupPolicy,
            spec: {
              ...userGroupPolicy.spec,
              module: 'asdasd/kubewarden/pod-privileged:v1.2.3'
            }
          }
        },
        moduleInfo: {
          registry:   'ghcr.io',
          repository: 'kubewarden/pod-privileged',
          tag:        'v1.2.3',
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
        isCreate:            () => false,
        policyServers:       () => [],
        policyServerOptions: () => [],
        isGlobal:            () => true,
        hasValuesModule:     () => true,
        showModeBanner:      () => false,
        modeDisabled:        () => false
      }
    });

    expect(wrapper.vm.policyRegistry).toBe('asdasd');
    expect(wrapper.vm.policyRepository).toBe('kubewarden/pod-privileged');
    expect(wrapper.vm.policyTag).toBe('v1.2.3');
  });
});
