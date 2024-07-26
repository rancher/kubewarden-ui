import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import DashboardView from '@kubewarden/components/Dashboard/DashboardView.vue';
import ConsumptionGauge from '@shell/components/ConsumptionGauge';

describe('component: DashboardView', () => {
  const commonMocks = {
    $fetchState: { pending: false },
    $store:      {
      getters: {
        currentCluster:                  () => 'current_cluster',
        'i18n/t':                        jest.fn(),
        'catalog/chart':                 jest.fn(),
        'catalog/charts':                jest.fn(),
        'cluster/all':                   jest.fn(),
        'cluster/canList':               () => true,
        'prefs/get':                     jest.fn(),
      },
    },
  };

  const commonComputed = {
    globalPolicies:     () => [],
    namespacedPolicies: () => []
  };

  const createWrapper = (overrides) => {
    return shallowMount(DashboardView, {
      mocks:    commonMocks,
      computed: commonComputed,
      ...overrides,
    });
  };

  it('renders correct gauge info of policy servers', () => {
    const pods = [
      {
        metadata: {
          state: {
            name:          'running',
            error:         false,
            transitioning: false,
          },
        },
      },
      {
        metadata: {
          state: {
            name:          'pending',
            error:         false,
            transitioning: true,
          },
        },
      },
    ];

    const wrapper = createWrapper({
      computed: { policyServerPods: () => pods },
      stubs:    { Masthead: { template: '<span />' } },
    });

    const gauges = wrapper.findAllComponents(ConsumptionGauge);

    expect(gauges.at(2).props().capacity).toStrictEqual(pods.length as Number);
    expect(gauges.at(2).props().used).toStrictEqual(1 as Number);
  });

  it('renders correct gauge info of admission policies', () => {
    const policies = [
      {
        status: {
          policyStatus: 'active',
          error:        false,
        },
        spec: { mode: 'protect' },
      },
      {
        status: {
          policyStatus: 'pending',
          error:        false,
        },
        spec: { mode: 'protect' },
      },
      {
        status: {
          policyStatus: 'unschedulable',
          error:        true,
        },
        spec: { mode: 'monitor' },
      },
    ];

    const wrapper = createWrapper({
      computed: { namespacedPolicies: () => policies },
      stubs:    { Masthead: { template: '<span />' } }
    });

    const gauges = wrapper.findAllComponents(ConsumptionGauge);

    expect(gauges.at(0).props().capacity).toStrictEqual(
      policies.length as Number
    );
    expect(gauges.at(0).props().used).toStrictEqual(1 as Number);
  });
});
