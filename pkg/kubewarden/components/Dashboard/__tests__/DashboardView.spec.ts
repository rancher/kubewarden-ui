import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import { nextTick } from 'vue';

const Loading = { template: '<span />' };

import { CATALOG, POD } from '@shell/config/types';

import { KUBEWARDEN, WG_POLICY_K8S } from '@kubewarden/types';
import { DASHBOARD_HEADERS } from '@kubewarden/config/table-headers';

import DashboardView from '@kubewarden/components/Dashboard/DashboardView.vue';

import mockControllerChart from '@tests/unit/mocks/controllerChart';
import mockPolicyServers from '@tests/unit/mocks/policyServers';
import { mockControllerAppLegacy } from '@tests/unit/mocks/controllerApp';

// Mock admission policies
const mockAdmissionPolicies = [{
  'id':         'default/namespaced-policy-1',
  'type':       'policies.kubewarden.io.admissionpolicy',
  'apiVersion': 'policies.kubewarden.io/v1',
  'kind':       'AdmissionPolicy',
  'metadata':   {
    'name':      'namespaced-policy-1',
    'namespace': 'default',
    'state':     {
      'error':         false,
      'message':       'Resource is current',
      'name':          'active',
      'transitioning': false
    },
  },
  'spec': {
    'backgroundAudit': true,
    'mode':            'protect',
    'module':          'ghcr.io/kubewarden/policies/example:v1.0.0',
    'mutating':        false,
    'policyServer':    'default',
    'rules':           [],
  },
  'status': {
    'mode':         'protect',
    'policyStatus': 'active'
  },
  'result': 'pass'
}, {
  'id':         'default/namespaced-policy-2',
  'type':       'policies.kubewarden.io.admissionpolicy',
  'apiVersion': 'policies.kubewarden.io/v1',
  'kind':       'AdmissionPolicy',
  'metadata':   {
    'name':      'namespaced-policy-2',
    'namespace': 'default',
    'state':     {
      'error':         false,
      'message':       'Resource is current',
      'name':          'active',
      'transitioning': false
    },
  },
  'spec': {
    'backgroundAudit': true,
    'mode':            'monitor',
    'module':          'ghcr.io/kubewarden/policies/example:v1.0.0',
    'mutating':        false,
    'policyServer':    'default',
    'rules':           [],
  },
  'status': {
    'mode':         'monitor',
    'policyStatus': 'active'
  },
  'result': 'fail'
}];

const mockClusterAdmissionPolicies = [{
  'id':         'cluster-policy-1',
  'type':       'policies.kubewarden.io.clusteradmissionpolicy',
  'apiVersion': 'policies.kubewarden.io/v1',
  'kind':       'ClusterAdmissionPolicy',
  'metadata':   {
    'name':  'cluster-policy-1',
    'state': {
      'error':         false,
      'message':       'Resource is current',
      'name':          'active',
      'transitioning': false
    },
  },
  'spec': {
    'backgroundAudit': true,
    'mode':            'protect',
    'module':          'ghcr.io/kubewarden/policies/example:v1.0.0',
    'mutating':        false,
    'policyServer':    'default',
    'rules':           [],
  },
  'status': {
    'mode':         'protect',
    'policyStatus': 'active'
  },
  'result': 'pass'
}, {
  'id':         'cluster-policy-2',
  'type':       'policies.kubewarden.io.clusteradmissionpolicy',
  'apiVersion': 'policies.kubewarden.io/v1',
  'kind':       'ClusterAdmissionPolicy',
  'metadata':   {
    'name':  'cluster-policy-2',
    'state': {
      'error':         false,
      'message':       'Resource is current',
      'name':          'active',
      'transitioning': false
    },
  },
  'spec': {
    'backgroundAudit': true,
    'mode':            'monitor',
    'module':          'ghcr.io/kubewarden/policies/example:v1.0.0',
    'mutating':        false,
    'policyServer':    'default',
    'rules':           [],
  },
  'status': {
    'mode':         'monitor',
    'policyStatus': 'active'
  },
  'result': 'fail'
}];

// Mock policy reports
const mockPolicyReports = [{
  'type':       'wgpolicyk8s.io.policyreport',
  'apiVersion': 'wgpolicyk8s.io/v1alpha2',
  'kind':       'PolicyReport',
  'metadata':   {
    'name':      'polr-ns-default',
    'namespace': 'default',
  },
  'results': [
    {
      'policy':  'namespaced-policy-1',
      'result':  'pass',
      'message': 'Pass',
      'spec':    { 'mode': 'protect' }
    },
    {
      'policy':  'namespaced-policy-2',
      'result':  'fail',
      'message': 'Fail',
      'spec':    { 'mode': 'monitor' }
    }
  ]
}];

const mockClusterPolicyReports = [{
  'type':       'wgpolicyk8s.io.clusterpolicyreport',
  'apiVersion': 'wgpolicyk8s.io/v1alpha2',
  'kind':       'ClusterPolicyReport',
  'metadata':   { 'name': 'clusterpolicyreport-default' },
  'results':    [
    {
      'policy':  'cluster-policy-1',
      'result':  'pass',
      'message': 'Pass',
      'spec':    { 'mode': 'protect' }
    },
    {
      'policy':  'cluster-policy-2',
      'result':  'fail',
      'message': 'Fail',
      'spec':    { 'mode': 'monitor' }
    }
  ]
}];

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
  case KUBEWARDEN.ADMISSION_POLICY:
    return mockAdmissionPolicies;
  case KUBEWARDEN.CLUSTER_ADMISSION_POLICY:
    return mockClusterAdmissionPolicies;
  case WG_POLICY_K8S.POLICY_REPORT.TYPE:
    return mockPolicyReports;
  case WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE:
    return mockClusterPolicyReports;
  default:
    return [];
  }
});

describe('component: DashboardView', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    // Reset mocks before each test
    clusterAllMock.mockClear();

    const getters = {
      currentCluster:    () => 'current_cluster',
      'i18n/t':          (key: string) => key,
      'catalog/chart':   () => mockControllerChart,
      'catalog/charts':  () => [mockControllerChart],
      'cluster/all':     () => clusterAllMock,
      'cluster/canList': () => jest.fn(() => true),
      'prefs/get':       () => jest.fn(),
    };

    const actions = {
      'cluster/findAll': jest.fn().mockResolvedValue([]),
      'catalog/load':    jest.fn().mockResolvedValue({}),
    };

    store = createStore({
      getters,
      actions
    });
  });

  const commonStubs = {
    'router-link': { template: '<span />' },
    RcItemCard:    {
      props:    ['id'],
      template: '<div :id="id"><slot name="item-card-content" /></div>'
    },
    PoliciesCard: true,
    Masthead:     true,
    Loading,
    ResourceRow:  true,
    EmptyRow:     true,
  };

  const createWrapper = async(overrides?: any) => {
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [store],
        stubs:   commonStubs,
      },
      ...overrides,
    });

    // Wait for the onMounted hook and async data fetching to complete
    await flushPromises();
    await nextTick();

    return wrapper;
  };

  it('renders the Masthead component', async() => {
    const wrapper = await createWrapper({});

    expect(wrapper.html()).toContain('<masthead-stub controllerapp="[object Object]"></masthead-stub>');
  });

  it('renders the Loading component when fetch state is pending', async() => {
    // Delay the store actions to keep loading state longer
    const delayedStore = createStore({
      getters: {
        currentCluster:    () => 'current_cluster',
        'i18n/t':          (key: string) => key,
        'catalog/chart':   () => mockControllerChart,
        'catalog/charts':  () => [],
        'cluster/all':     () => clusterAllMock,
        'cluster/canList': () => jest.fn(() => true),
        'prefs/get':       () => jest.fn(),
      },
      actions: {
        'cluster/findAll': jest.fn(() => new Promise(() => {})), // Never resolves
        'catalog/load':    jest.fn(() => new Promise(() => {})), // Never resolves
      },
    });

    const wrapper = mount(DashboardView, {
      global: {
        plugins: [delayedStore],
        stubs:   commonStubs,
      },
    });

    await nextTick();

    // The component should show loading initially since async operations won't complete
    // Check that the dashboard content is not present
    expect(wrapper.find('.dashboard').exists()).toBe(false);
  });

  it('renders the correct number of Card components based on DASHBOARD_HEADERS', async() => {
    const wrapper = await createWrapper();
    const cardComponents = wrapper.findAll('[id^="card-"]');

    expect(cardComponents.length).toBe(DASHBOARD_HEADERS.length);
  });

  it('renders PolicyServerCard component for the Policy Servers card', async() => {
    const wrapper = await createWrapper();

    const cards = wrapper.findAll('[id^="card-"]');

    expect(cards.length).toBe(DASHBOARD_HEADERS.length);

    const policyServerCardComponent = wrapper.findAll('policies-card-stub')[0];

    expect(policyServerCardComponent.exists()).toBe(true);

    const serversProp = wrapper.findAll('resource-row-stub');

    expect(Array.isArray(serversProp)).toBe(true);
    expect(serversProp).toHaveLength(mockPolicyServers.length);
  });

  it('loads correctly namespace policies', async() => {
    const wrapper = await createWrapper();
    const expectation = {
      'mode': {
        'monitor': 1,
        'protect': 1
      },
      'rows': [{
        'color':   'success',
        'count':   1,
        'label':   'kubewarden.dashboard.cards.generic.success',
        'percent': 50
      }, {
        'color':   'error',
        'count':   1,
        'label':   'kubewarden.dashboard.cards.generic.error',
        'percent': 50
      }]
    };

    expect(wrapper.vm.namespacedStats).toEqual(expectation);
  });

  it('loads correctly namespace reports', async() => {
    const wrapper = await createWrapper();
    const expectation = {
      'mode': {
        'monitor': 1,
        'protect': 1
      },
      'rows': [{
        'color':   'success',
        'count':   1,
        'label':   'kubewarden.dashboard.cards.generic.success',
        'percent': 50
      }, {
        'color':   'error',
        'count':   1,
        'label':   'kubewarden.dashboard.cards.generic.error',
        'percent': 50
      }]
    };

    expect(wrapper.vm.namespacesResults).toEqual(expectation);
  });

  it('loads correctly cluster policies', async() => {
    const wrapper = await createWrapper();

    const expectation = {
      'mode': {
        'monitor': 1,
        'protect': 1
      },
      'rows': [{
        'color':   'success',
        'count':   1,
        'label':   'kubewarden.dashboard.cards.generic.success',
        'percent': 50
      }, {
        'color':   'error',
        'count':   1,
        'label':   'kubewarden.dashboard.cards.generic.error',
        'percent': 50
      }]
    };

    expect(wrapper.vm.clusterStats).toEqual(expectation);
  });

  it('loads correctly cluster reports', async() => {
    const wrapper = await createWrapper();
    const expectation = {
      'mode': {
        'monitor': 1,
        'protect': 1
      },
      'rows': [{
        'color':   'success',
        'count':   1,
        'label':   'kubewarden.dashboard.cards.generic.success',
        'percent': 50
      }, {
        'color':   'error',
        'count':   1,
        'label':   'kubewarden.dashboard.cards.generic.error',
        'percent': 50
      }]
    };

    expect(wrapper.vm.clusterResults).toEqual(expectation);
  });

  it('loads correctly policy servers', async() => {
    const expectation = [
      {
        'label':  'default',
        'to':     undefined,
        'color':  'success',
        'counts': [
          {
            'count': 2,
            'label': 'protect'
          },
          {
            'count': 2,
            'label': 'monitor'
          }
        ]
      },
      {
        'label':  'other',
        'to':     undefined,
        'color':  'warning',
        'counts': [
          {
            'count': 0,
            'label': 'protect'
          },
          {
            'count': 0,
            'label': 'monitor'
          }
        ]
      }
    ];
    const wrapper = await createWrapper();

    expect(wrapper.vm.policyServersWithStatusAndModes).toEqual(expectation);
  });
});
