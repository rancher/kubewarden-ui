import { mount } from '@vue/test-utils';

import Loading from '@shell/components/Loading';
import { CATALOG, POD } from '@shell/config/types';

import { KUBEWARDEN } from '@kubewarden/types';
import { DASHBOARD_HEADERS } from '@kubewarden/config/table-headers';

import DashboardView from '@kubewarden/components/Dashboard/DashboardView.vue';
import PoliciesCard from '@kubewarden/components/Dashboard/PoliciesCard.vue';
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
        labels: { app: 'kubewarden-policy-server-default' },
        state:  {
          name:          'running',
          error:         false,
          transitioning: false,
        },
      },
    },
    {
      metadata: {
        labels: { app: 'kubewarden-policy-server-other' },
        state:  {
          name:          'pending',
          error:         false,
          transitioning: true,
        },
      },
    }];

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

  const commonStubs = {
    'router-link': { template: '<span />' },
    RcItemCard:    true
  };

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
    const cardComponents = wrapper.findAllComponents(PoliciesCard);

    expect(cardComponents.length).toBe(DASHBOARD_HEADERS.length);
  });

  it('renders PolicyServerCard component for the Policy Servers card', () => {
    commonMocks.$fetchState.pending = false;

    const wrapper = createWrapper();

    const cards = wrapper.findAllComponents(PoliciesCard);

    expect(cards.length).toBe(DASHBOARD_HEADERS.length);

    // The third card in the array is index 2
    const policyServersCard = cards[2];
    const policyServerCardComponent = policyServersCard.findComponent(PoliciesCard);

    expect(policyServerCardComponent.exists()).toBe(true);

    const serversProp = policyServerCardComponent.props('policyServers');

    expect(Array.isArray(serversProp)).toBe(true);

    expect(serversProp).toHaveLength(mockPolicyServers.length);
  });

  it('renders correct policy-server data', () => {
    const wrapper = createWrapper();
    const policyServerCardComponent = wrapper.findComponent(PoliciesCard);

    const serversProp = policyServerCardComponent.props('policyServers');

    expect(serversProp[0]._status).toBe('running');
    expect(serversProp[1]._status).toBe('pending');
  });

  it('loads correctly namespace policies', () => {
    const wrapper = createWrapper();
    const expectation = {
      'mode': {
        'monitor': 0,
        'protect': 0
      },
      'rows': [{
        'color':   'success',
        'count':   0,
        'label':   'kubewarden.dashboard.cards.generic.success',
        'percent': 0
      }, {
        'color':   'error',
        'count':   0,
        'label':   'kubewarden.dashboard.cards.generic.error',
        'percent': 0
      }]
    };

    expect(wrapper.vm.namespacedStats).toEqual(expectation);
  });

  fit('loads correctly namespace reports', () => {
    const wrapper = createWrapper();
    const expectation = [];

    expect(wrapper.vm.namespacesResults).toEqual(expectation);
  });

  it('loads correctly cluster policies', () => {
    const wrapper = createWrapper();
    const expectation = {
      'mode': {
        'monitor': 0,
        'protect': 0
      },
      'rows': [{
        'color':   'success',
        'count':   0,
        'label':   'kubewarden.dashboard.cards.generic.success',
        'percent': 0
      }, {
        'color':   'error',
        'count':   0,
        'label':   'kubewarden.dashboard.cards.generic.error',
        'percent': 0
      }]
    };

    expect(wrapper.vm.clusterStats).toEqual(expectation);
  });

  it('loads correctly cluster reports', () => {
    const wrapper = createWrapper();
    const expectation = {
      'mode': {
        'monitor': 0,
        'protect': 0
      },
      'rows': [{
        'color':   'success',
        'count':   0,
        'label':   'kubewarden.dashboard.cards.generic.success',
        'percent': 0
      }, {
        'color':   'error',
        'count':   0,
        'label':   'kubewarden.dashboard.cards.generic.error',
        'percent': 0
      }]
    };

    expect(wrapper.vm.clusterResults).toEqual(expectation);
  });

  it('loads correctly policy servers', () => {
    const expectation = [];
    const wrapper = createWrapper();

    expect(wrapper.vm.policyServersWithStatusAndModes).toEqual(expectation);
  });
});
