import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import DashboardView from '@kubewarden/components/Dashboard/DashboardView.vue';
import DefaultsBanner from '@kubewarden/components/DefaultsBanner';
import ConsumptionGauge from '@shell/components/ConsumptionGauge';

import DEFAULTS_APP from '../../templates/defaultsApp';
import PS_POD from '../../templates/policyServerPod';

describe('component: DashboardView', () => {
  const commonMocks = {
    $fetchState: { pending: false },
    $store:      {
      getters: {
        currentCluster:                  () => 'current_cluster',
        currentProduct:                  () => 'current_product',
        'kubewarden/hideBannerDefaults': jest.fn(),
        'i18n/t':                        jest.fn(),
        'catalog/chart':                 jest.fn(),
        'catalog/charts':                jest.fn(),
        'cluster/all':                   jest.fn(),
        'cluster/canList':               () => true
      },
    }
  };

  const commonComputed = {
    controllerApp:      () => null,
    controllerChart:    () => null,
    defaultsApp:        () => DEFAULTS_APP,
    hideBannerDefaults: () => false,
    policyServerPods:   () => [PS_POD],
    globalPolicies:     () => [],
    namespacedPolicies: () => [],
    version:            () => '1.25',
    upgradeAvailable:   () => null
  };

  const createWrapper = (overrides) => {
    return shallowMount(DashboardView, {
      mocks:    commonMocks,
      computed: commonComputed,
      ...overrides
    });
  };

  it('renders defaults banner when default app is not found', () => {
    const wrapper = createWrapper({
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

    const wrapper = createWrapper({
      data() {
        return { psPods: pods };
      },
      stubs: { DefaultsBanner: { template: '<span />' } }
    });

    const gauges = wrapper.findAllComponents(ConsumptionGauge);

    expect(gauges.at(0).props().capacity).toStrictEqual([PS_POD].length as Number);
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

    const wrapper = createWrapper({
      computed: { namespacedPolicies: () => policies },
      stubs:    { DefaultsBanner: { template: '<span />' } }
    });

    const gauges = wrapper.findAllComponents(ConsumptionGauge);

    expect(gauges.at(1).props().capacity).toStrictEqual(policies.length as Number);
    expect(gauges.at(1).props().used).toStrictEqual(1 as Number);
  });

  it('renders the "Upgrade Available" button when an upgrade is available', () => {
    const oldControllerApp = { spec: { chart: { metadata: { version: '1.0.0' } } } };
    const newControllerChart = {
      versions: [
        { version: '1.1.0' }
      ]
    };

    const wrapper = createWrapper({
      computed: {
        controllerApp:   () => oldControllerApp,
        controllerChart:  () => newControllerChart,
        version:          () => '1.0.0',
      }
    });

    const upgradeButton = wrapper.find('[data-testid="kw-app-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain('Upgrade Available');
  });
});
