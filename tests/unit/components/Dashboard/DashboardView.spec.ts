import { mount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import Loading from '@shell/components/Loading';

import DashboardView from '@kubewarden/components/Dashboard/DashboardView.vue';
import Card from '@kubewarden/components/Dashboard/Card.vue';
import Masthead from '@kubewarden/components/Dashboard/Masthead.vue';
import Modes from '@kubewarden/components/Dashboard/Modes.vue';
import Events from '@kubewarden/components/Dashboard/Events.vue';
import EventsGauge from '@kubewarden/components/Dashboard/EventsGauge.vue';
import { DASHBOARD_HEADERS } from '@kubewarden/config/table-headers';

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
        'cluster/canList':               jest.fn(() => true),
        'prefs/get':                     jest.fn(),
      },
    },
  };

  const commonComputed = {
    globalPolicies:     () => [],
    namespacedPolicies: () => [],
    allPolicyServers:   () => [],
    policyServerCounts: () => ({
      status: {
        running: 0, stopped: 0, pending: 0
      },
      total: 0
    }),
  };

  const commonStubs = { 'router-link': { template: '<span />' } };

  const createWrapper = (overrides) => {
    return mount(DashboardView, {
      mocks:    commonMocks,
      computed: commonComputed,
      stubs:    commonStubs,
      ...overrides,
    });
  };

  it('renders the Masthead component', () => {
    const wrapper = createWrapper({});

    expect(wrapper.findComponent(Masthead).exists()).toBe(true);
  });

  it('renders the Loading component when fetch state is pending', () => {
    const wrapper = createWrapper({
      mocks: {
        ...commonMocks,
        $fetchState: { pending: true },
      },
    });

    expect(wrapper.findComponent(Loading).exists()).toBe(true);
  });

  it('renders the correct number of Card components based on DASHBOARD_HEADERS', () => {
    const wrapper = createWrapper({});
    const cardComponents = wrapper.findAllComponents(Card);

    expect(cardComponents.length).toBe(DASHBOARD_HEADERS.length);
  });

  it('renders ConsumptionGauge component with correct props', () => {
    const wrapper = createWrapper({
      computed: {
        globalPolicies:     () => [],
        namespacedPolicies: () => [],
        allPolicyServers:   () => [],
        policyServerCounts: () => ({
          status: {
            running: 1, stopped: 0, pending: 0
          },
          total: 2
        })
      }
    });

    const gauge = wrapper.findComponent(ConsumptionGauge);

    expect(gauge.exists()).toBe(true);
    expect(gauge.props('capacity')).toBe(2);
    expect(gauge.props('used')).toBe(1);
    expect(gauge.props('colorStops')).toEqual({
      25: '--error', 50: '--warning', 70: '--info'
    });
  });

  it('correctly applies class names based on policy server counts', () => {
    const wrapper = createWrapper({
      computed: {
        globalPolicies:     () => [],
        namespacedPolicies: () => [],
        allPolicyServers:   () => [{}, {}]
      }
    });

    const btn = wrapper.find('.role-secondary');

    expect(btn.exists()).toBe(true);
  });

  it('renders EventsGauge component when namespacedPolicies are present', () => {
    const wrapper = createWrapper({
      computed: {
        globalPolicies:     () => [],
        namespacedPolicies: () => [{}, {}],
        allPolicyServers:   () => []
      }
    });

    const eventsGauge = wrapper.findComponent(EventsGauge);

    expect(eventsGauge.exists()).toBe(true);
  });

  it('renders Events and Modes components for namespaced policies', () => {
    const wrapper = createWrapper({
      computed: {
        globalPolicies:     () => [],
        namespacedPolicies: () => [{}, {}],
        allPolicyServers:   () => []
      }
    });

    expect(wrapper.findComponent(Events).exists()).toBe(true);
    expect(wrapper.findComponent(Modes).exists()).toBe(true);
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

    const wrapper = createWrapper({
      computed: {
        globalPolicies:     () => [],
        namespacedPolicies: () => [],
        allPolicyServers:   () => [{}],
        policyServerPods:   () => pods
      },
      stubs: { Masthead: { template: '<span />' } },
    });

    const gauges = wrapper.findComponent(ConsumptionGauge);

    expect(gauges.props().capacity).toStrictEqual(pods.length as Number);
    expect(gauges.props().used).toStrictEqual(1 as Number);
  });

  it('renders correct gauge info for admission policy events', () => {
    const policies = [
      {
        result: 'pass',
        policy: 'namespaced-policy-1',
      },
      {
        result: 'fail',
        policy: 'namespaced-policy-2',
      },
      {
        result: 'error',
        policy: 'namespaced-policy-3',
      },
    ];
    const summary = {
      status: {
        error: 1, fail: 1, success: 1
      },
      total: 3
    };

    const wrapper = createWrapper({
      computed: {
        admissionPolicyResults: () => policies,
        namespacedPolicies:     () => [],
        globalPolicies:         () => [],
        allPolicyServers:       () => [],
      }
    });

    const gauges = wrapper.findAllComponents(EventsGauge);

    expect(gauges.at(0).exists()).toBe(true);
    expect(gauges.at(0).props().events).toStrictEqual(summary);
  });
});
