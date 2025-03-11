import { mount } from '@vue/test-utils';

import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import Loading from '@shell/components/Loading';
import { CATALOG, POD } from '@shell/config/types';

import { KUBEWARDEN } from '@kubewarden/types';
import { DASHBOARD_HEADERS } from '@kubewarden/config/table-headers';

import DashboardView from '@kubewarden/components/Dashboard/DashboardView.vue';
import Card from '@kubewarden/components/Dashboard/Card.vue';
import Masthead from '@kubewarden/components/Dashboard/Masthead.vue';

import mockControllerChart from '@tests/unit/mocks/controllerChart';
import mockPolicyServers from '@tests/unit/mocks/policyServers';
import { mockControllerAppLegacy } from '@tests/unit/mocks/controllerApp';

// Create a mock for the 'cluster/all' getter that returns different values based on the input.
const clusterAllMock = jest.fn((resourceType) => {
  switch (resourceType) {
  case CATALOG.APP:
    return [mockControllerAppLegacy];
  case POD:
    return [{
      metadata: {
        labels: { 'kubewarden/policy-server': 'default' },
        state:  {
          name:          'running',
          error:         false,
          transitioning: false,
        },
      },
    },
    {
      metadata: {
        labels: { 'kubewarden/policy-server': 'other' },
        state:  {
          name:          'pending',
          error:         false,
          transitioning: true,
        },
      },
    }
    ];
  case KUBEWARDEN.POLICY_SERVER:
    return mockPolicyServers;
  default:
    return [];
  }
});

describe('component: DashboardView', () => {
  const commonMocks = {
    $fetchState: { pending: false },
    $store:      {
      getters: {
        currentCluster:                  () => 'current_cluster',
        'i18n/t':                        jest.fn(),
        'catalog/chart':                 mockControllerChart,
        'catalog/charts':                [mockControllerChart],
        'cluster/all':                   clusterAllMock,
        'cluster/canList':               jest.fn(() => true),
        'prefs/get':                     jest.fn(),
      },
    },
  };

  const commonStubs = { 'router-link': { template: '<span />' } };

  const createWrapper = (overrides?: any) => {
    return mount(DashboardView, {
      global: {
        mocks:    commonMocks,
        stubs:    commonStubs,
      },
      ...overrides,
    });
  };

  it('renders the Masthead component', () => {
    const wrapper = createWrapper({});

    expect(wrapper.findComponent(Masthead).exists()).toBe(true);
  });

  it('renders the Loading component when fetch state is pending', () => {
    commonMocks.$fetchState.pending = true;

    const wrapper = createWrapper();

    expect(wrapper.findComponent(Loading).exists()).toBe(true);
  });

  it('renders the correct number of Card components based on DASHBOARD_HEADERS', () => {
    commonMocks.$fetchState.pending = false;

    const wrapper = createWrapper();
    const cardComponents = wrapper.findAllComponents(Card);

    expect(cardComponents.length).toBe(DASHBOARD_HEADERS.length);
  });

  it('renders ConsumptionGauge component with correct props', () => {
    const wrapper = createWrapper();

    const gauge = wrapper.findComponent(ConsumptionGauge);

    expect(gauge.exists()).toBe(true);
    expect(gauge.props('capacity')).toBe(2);
    expect(gauge.props('used')).toBe(1);
    expect(gauge.props('colorStops')).toEqual({
      25: '--error',
      50: '--warning',
      70: '--success'
    });
  });

  it('correctly applies class names based on policy server counts', () => {
    const wrapper = createWrapper();

    const btn = wrapper.find('.role-secondary');

    expect(btn.exists()).toBe(true);
  });

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

    const wrapper = createWrapper({ stubs: { Masthead: { template: '<span />' } } });

    const gauges = wrapper.findComponent(ConsumptionGauge);

    expect(gauges.props().capacity).toStrictEqual(pods.length as number);
    expect(gauges.props().used).toStrictEqual(1 as number);
  });
});
