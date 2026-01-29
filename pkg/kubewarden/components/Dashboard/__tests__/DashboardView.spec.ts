import { mount } from '@vue/test-utils';

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
  'metadata':   {
    'name': 'clusterpolicyreport-default',
  },
  'results': [
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
  let commonMocks;

  beforeEach(() => {
    // Reset mocks before each test
    clusterAllMock.mockClear();

    commonMocks = {
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

  const createWrapper = (overrides?: any) => {
    // Create a fresh copy of mocks for each wrapper to avoid mutation issues
    const freshMocks = {
      $fetchState: { ...commonMocks.$fetchState },
      $store:      {
        getters: {
          ...commonMocks.$store.getters,
          'cluster/all': clusterAllMock, // Ensure we use the fresh mock
        },
      },
    };

    return mount(DashboardView, {
      global: {
        mocks: {
          ...freshMocks,
          $t: jest.fn(), // Stub useI18n composable to avoid setup error
        },
        stubs: commonStubs,
      },
      ...overrides,
    });
  };

  it('renders the Masthead component', () => {
    const wrapper = createWrapper({});

    expect(wrapper.html()).toContain('<masthead-stub controllerapp="[object Object]"></masthead-stub>');
  });

  it('renders the Loading component when fetch state is pending', () => {
    commonMocks.$fetchState.pending = true;

    const wrapper = createWrapper();

    expect(wrapper.findComponent(Loading).exists()).toBe(true);
  });

  it('renders the correct number of Card components based on DASHBOARD_HEADERS', () => {
    commonMocks.$fetchState.pending = false;

    const wrapper = createWrapper();
    const cardComponents = wrapper.findAll('[id^="card-"]');

    expect(cardComponents.length).toBe(DASHBOARD_HEADERS.length);
  });

  it('renders PolicyServerCard component for the Policy Servers card', () => {
    commonMocks.$fetchState.pending = false;
    const wrapper = createWrapper();

    const cards = wrapper.findAll('[id^="card-"]');

    expect(cards.length).toBe(DASHBOARD_HEADERS.length);

    const policyServerCardComponent = wrapper.findAll('policies-card-stub')[0];

    expect(policyServerCardComponent.exists()).toBe(true);

    const serversProp = wrapper.findAll('resource-row-stub');

    expect(Array.isArray(serversProp)).toBe(true);
    expect(serversProp).toHaveLength(mockPolicyServers.length);
  });

  it('loads correctly namespace policies', () => {
    const wrapper = createWrapper();
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

  it('loads correctly namespace reports', () => {
    const wrapper = createWrapper();
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

  it('loads correctly cluster policies', () => {
    const wrapper = createWrapper();

    wrapper.vm.$store.getters['cluster/all'] = jest.fn(() => [{
      'id':         'default/test2',
      'type':       'policies.kubewarden.io.admissionpolicy',
      'apiVersion': 'policies.kubewarden.io/v1',
      'kind':       'AdmissionPolicy',
      'metadata':   {
        'annotations': {
          'kubewarden.io/chart-key':     'cluster/kubewarden-policy-catalog/affinity-node-selector/1.0.3',
          'kubewarden.io/chart-name':    'affinity-node-selector',
          'kubewarden.io/chart-version': '1.0.3'
        },
        'managedFields': [
          { 'apiVersion': 'policies.kubewarden.io/v1' },
          { 'apiVersion': 'policies.kubewarden.io/v1' }
        ],
        'name':          'test2',
        'namespace':     'default',
        'relationships': null,
        'state':         {
          'error':         false,
          'message':       'Resource is current',
          'name':          'active',
          'transitioning': false
        },
        'uid': '3163f264-8ffb-40cb-8ae9-5ef9a6cb4ad6'
      },
      'spec': {
        'backgroundAudit': true,
        'mode':            'protect',
        'module':          'ghcr.io/kubewarden/policies/affinity-node-selector:v1.0.3',
        'mutating':        false,
        'policyServer':    'default',
        'rules':           [],
        'settings':        {
          'key':   '2',
          'value': '2'
        },
      },
      'status': {
        'conditions':   [],
        'mode':         'protect',
        'policyStatus': 'active'
      }
    }]);
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

  it('loads correctly cluster reports', () => {
    const wrapper = createWrapper();
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

  it('loads correctly policy servers', () => {
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
    const wrapper = createWrapper();

    expect(wrapper.vm.policyServersWithStatusAndModes).toEqual(expectation);
  });
});
