import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import { KUBEWARDEN } from '@kubewarden/types';
import General from '@kubewarden/chart/kubewarden/admission/General.vue';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import KeyValue from '@shell/components/form/KeyValue';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import { RadioGroup } from '@components/Form/Radio';

import policyConfig from '../../templates/policyConfig';

describe('component: General', () => {
  it('should display the PolicyServer options if available', () => {
    const ps = [{ id: 'default' }, { id: 'custom-ps' }];

    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { targetNamespace: 'default', value: { policy: policyConfig } },
      provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
      computed:  {
        policyServers:       () => ps,
        policyServerOptions: () => ['default', 'custom-ps'],
        isGlobal:            () => true
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
    expect(input.props().options).toStrictEqual(['default', 'custom-ps'] as String[]);
  });

  it('monitor mode should be protect by default', async() => {
    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { targetNamespace: 'default', value: { policy: policyConfig } },
      provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
      computed:  { policyServerOptions: () => ['default', 'custom-ps'], isGlobal: () => true },
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
        LabeledTooltip:    { template: '<span />' }
      }
    });
    const radio = wrapper.findAllComponents(RadioGroup).at(0);

    await wrapper.setData({ policy: { spec: { mode: 'protect' } } });

    expect(radio.props().value).toStrictEqual('protect' as String);
  });

  it('matchExpressions should add to the policy namespaceSelector spec', async() => {
    const newMatchExp = {
      key: 'runlevel', operator: 'NotIn', values: ['0', '1']
    };

    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { targetNamespace: 'default', value: { policy: policyConfig } },
      provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
      computed:  { policyServerOptions: () => ['default', 'custom-ps'], isGlobal: () => true },
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
        LabeledTooltip:    { template: '<span />' }
      }
    });
    const matchExp = wrapper.findComponent(MatchExpressions);

    expect(matchExp.props().value).toStrictEqual(policyConfig.spec.namespaceSelector.matchExpressions);

    const existingMatchExp = policyConfig.spec.namespaceSelector.matchExpressions;

    await wrapper.setData({ policy: { spec: { namespaceSelector: { matchExpressions: [...existingMatchExp, newMatchExp] } } } });

    expect(matchExp.props().value).toStrictEqual(wrapper.props().value.policy.spec.namespaceSelector.matchExpressions);
  });

  it('matchExpressions should remove matchExpression from policy spec', async() => {
    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { targetNamespace: 'default', value: { policy: policyConfig } },
      provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
      computed:  { policyServerOptions: () => ['default', 'custom-ps'], isGlobal: () => true },
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
        LabeledTooltip:    { template: '<span />' }
      }
    });
    const matchExp = wrapper.findComponent(MatchExpressions);

    expect(matchExp.props().value).toStrictEqual(policyConfig.spec.namespaceSelector.matchExpressions);

    await wrapper.setData({ policy: { spec: { namespaceSelector: { matchExpressions: [] } } } });

    expect(matchExp.props().value).toStrictEqual([]);
  });

  it('matchLabels should add and remove label selector to policy spec', async() => {
    const defaultMatchLabel = { key: 'environment', value: 'prod' };
    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { targetNamespace: 'default', value: { policy: policyConfig } },
      provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
      computed:  { policyServerOptions: () => ['default', 'custom-ps'], isGlobal: () => true },
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
        LabeledTooltip:    { template: '<span />' }
      }
    });
    const keyValue = wrapper.findComponent(KeyValue);

    expect(keyValue.props().value).toStrictEqual(policyConfig.spec.namespaceSelector.matchLabels);

    await wrapper.setData({ policy: { spec: { namespaceSelector: { matchLabels: defaultMatchLabel } } } });

    expect(keyValue.props().value).toStrictEqual(defaultMatchLabel);

    await wrapper.setData({ policy: { spec: { namespaceSelector: { matchLabels: {} } } } });

    expect(keyValue.props().value).toStrictEqual({});
  });
});
