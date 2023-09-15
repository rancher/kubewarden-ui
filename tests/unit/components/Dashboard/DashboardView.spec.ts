import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import DashboardView from '@kubewarden/components/Dashboard/DashboardView.vue';
import DefaultsBanner from '@kubewarden/components/DefaultsBanner';
import ConsumptionGauge from '@shell/components/ConsumptionGauge';

describe('component: DashboardView', () => {
  it('renders defaults banner when default app is not found', () => {
    const wrapper = shallowMount(DashboardView as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      computed:  {
        defaultsApp:        () => null,
        defaultsChart:      () => null,
        hideBannerDefaults: () => false,
        policyServerPods:   () => [],
        globalPolicies:     () => [],
        namespacedPolicies: () => [],
        version:            () => '1.25'
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentCluster:                  () => 'current_cluster',
            currentProduct:                  () => 'current_product',
            'current_product/all':           jest.fn(),
            'i18n/t':                        jest.fn(),
            'kubewarden/hideBannerDefaults': jest.fn(),
            'catalog/chart':                 jest.fn()
          },
        }
      },
      stubs: {
        Card:             { template: '<span />' },
        ConsumptionGauge: { template: '<span />' }
      }
    });

    const banner = wrapper.findComponent(DefaultsBanner);

    expect(banner.exists()).toBe(true);
  });

  it('renders correct gauge info of policy servers', () => {
    const pods = [
      {
        metadata: {
          state: {
            name:          'running',
            error:         false,
            transitioning: false
          }
        }
      },
      {
        metadata: {
          state: {
            name:          'pending',
            error:         false,
            transitioning: true
          }
        }
      }
    ];

    const wrapper = shallowMount(DashboardView as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      computed:  {
        defaultsApp:        () => null,
        policyServerPods:   () => pods,
        globalPolicies:     () => [],
        namespacedPolicies: () => [],
        version:            () => '1.25'
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentCluster:                  () => 'current_cluster',
            currentProduct:                  () => 'current_product',
            'current_product/all':           jest.fn(),
            'i18n/t':                        jest.fn(),
            'kubewarden/hideBannerDefaults': jest.fn(),
            'catalog/chart':                 jest.fn()
          },
        }
      },
      stubs: { DefaultsBanner: { template: '<span />' } }
    });

    const gauges = wrapper.findAllComponents(ConsumptionGauge);

    expect(gauges.at(0).props().capacity).toStrictEqual(pods.length as Number);
    expect(gauges.at(0).props().used).toStrictEqual(1 as Number);
  });

  it('renders correct gauge info of admission policies', () => {
    const policies = [
      {
        status: {
          policyStatus: 'active',
          error:        false,
        },
        spec: { mode: 'protect' }
      },
      {
        status: {
          policyStatus: 'pending',
          error:        false,
        },
        spec: { mode: 'protect' }
      },
      {
        status: {
          policyStatus: 'unschedulable',
          error:        true,
        },
        spec: { mode: 'monitor' }
      }
    ];

    const wrapper = shallowMount(DashboardView as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      computed:  {
        defaultsApp:        () => null,
        policyServerPods:   () => [],
        globalPolicies:     () => [],
        namespacedPolicies: () => policies,
        version:            () => '1.25'
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentCluster:                  () => 'current_cluster',
            currentProduct:                  () => 'current_product',
            'current_product/all':           jest.fn(),
            'i18n/t':                        jest.fn(),
            'kubewarden/hideBannerDefaults': jest.fn(),
            'catalog/chart':                 jest.fn()
          },
        }
      },
      stubs: { DefaultsBanner: { template: '<span />' } }
    });

    const gauges = wrapper.findAllComponents(ConsumptionGauge);

    expect(gauges.at(1).props().capacity).toStrictEqual(policies.length as Number);
    expect(gauges.at(1).props().used).toStrictEqual(1 as Number);
  });
});
