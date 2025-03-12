import { shallowMount, flushPromises } from '@vue/test-utils';

import { KUBEWARDEN } from '@kubewarden/types';
import { CATALOG, SERVICE } from '@shell/config/types';
import { KUBERNETES } from '@shell/config/labels-annotations';

import TraceTable from '@kubewarden/components/TraceTable.vue';

import mockControllerChart from '@tests/unit/mocks/controllerChart';
import mockTraces from '@tests/unit/mocks/policyTraces';
import { mockControllerApp, mockControllerValues } from '@tests/unit/mocks/controllerApp';

// Create a mock for the 'cluster/all' getter so that it returns different values based on resource type.
const clusterAllMock = (resourceType: string) => {
  switch (resourceType) {
  case CATALOG.APP:
    // Return a controller app so that computed "controllerApp" and tracingConfiguration can resolve.
    return [{
      ...mockControllerApp,
      fetchValues: jest.fn().mockResolvedValue(mockControllerValues)
    }];
  case SERVICE:
    // Return two services: one qualifies as jaeger and one as openTelemetry.
    return [
      {
        name:     'jaeger-query-svc',
        links: {
          remove: '/k8s/clusters/c-6r6r2/v1/services/jaeger/my-open-telemetry-query',
          self:   '/k8s/clusters/c-6r6r2/v1/services/jaeger/my-open-telemetry-query',
          update: '/k8s/clusters/c-6r6r2/v1/services/jaeger/my-open-telemetry-query',
          view:   '/k8s/clusters/c-6r6r2/api/v1/namespaces/jaeger/services/my-open-telemetry-query'
        },
        metadata: { labels: { 'app.kubernetes.io/part-of': 'jaeger' } },
        spec:     { ports: [{ port: 16685 }] }
      },
      {
        name:     'open-tel-svc',
        metadata: {
          labels: {
            'opentelemetry-operator':  'opentelemetry-operator',
            [KUBERNETES.MANAGED_NAME]: 'opentelemetry-operator'
          }
        },
        spec: { ports: [{ port: 8080 }] }
      }
    ];
  default:
    return [];
  }
};

// This mock for dispatch will allow Jaeger fetch calls to succeed
// and any other calls to just return an empty object
const dispatchMock = jest.fn(async(payload) => {
  if (typeof payload.url === 'string' && payload.url.includes('api/traces')) {
    return { data: mockTraces };
  }

  return { data: [] };
});


const commonMocks = {
  $fetchState: { pending: false },
  $store:      {
    getters: {
      currentCluster:                { id: 'current_cluster' },
      currentStore:                  () => 'cluster',
      productId:                     () => 'some-product',
      'catalog/charts':              [mockControllerChart],
      'cluster/all':                 jest.fn((type: string) => clusterAllMock(type)),
      'cluster/canList':             () => true,
      'i18n/t':                      (key) => key,
      'management/byId':             () => 'local',
      'resource-fetch/refreshFlag':  jest.fn(),
      'cluster/schemaFor':           () => ({ attributes: { namespaced: false } }),
      'kubewarden/refreshingCharts': false
    },
    dispatch: dispatchMock
  },
  $route: { params: { cluster: '_' } }
};

const commonStubs = {
  Loading:        true,
  Banner:         true,
  SortableTable:  true,
  TraceChecklist: true,
  BadgeState:     true,
  'router-link':  true
};

// Helper to create a mounted wrapper.
const createWrapper = (options: any = {}) => {
  return shallowMount(TraceTable, {
    global: {
      mocks: {
        ...commonMocks,
        ...options.mocks
      },
      stubs: {
        ...commonStubs,
        ...options.stubs
      }
    },
    props: { ...options.props }
  });
};

describe('TraceTable.vue', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  });

  it('renders Loading component when fetch is pending', () => {
    const wrapper = createWrapper({ mocks: { $fetchState: { pending: true } } });

    expect(wrapper.findComponent({ name: 'Loading' }).exists()).toBe(true);
  });

  it('renders TraceChecklist when showChecklist is true', async() => {
    // To force showChecklist to be true we simulate missing required services by making SERVICE getter return an empty array.
    const wrapper = createWrapper({
      props: { resource: 'non-policy-resource' },
      mocks: {
        $store: {
          getters: {
            ...commonMocks.$store.getters,
            'cluster/all': () => []
          }
        }
      }
    });

    wrapper.setData({ isAdminUser: true });
    await wrapper.vm.$nextTick();

    // With no SERVICE data, computed "jaegerQuerySvc" and "openTelSvc" will be null,
    // so "showChecklist" (which is computed as: (!openTelSvc || !jaegerQuerySvc || !tracingConfiguration)) is true.
    expect(wrapper.findComponent({ name: 'TraceChecklist' }).exists()).toBe(true);
  });

  it('renders error Banner when showChecklist is false and emptyPolicies is true', async() => {
    const wrapper = createWrapper({
      props: {
        resource:        KUBEWARDEN.POLICY_SERVER,
        relatedPolicies: [] // Empty array so that emptyPolicies is true
      }
    });

    await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
    await flushPromises();

    const banner = wrapper.findComponent({ name: 'Banner' });

    expect(banner.exists()).toBe(true);
    expect(banner.props('label')).toBe('%kubewarden.tracing.noRelatedPolicies%');
  });

  it('renders SortableTable when showTable is true', async() => {
    const policies = [
      {
        kind:     'ClusterAdmissionPolicy',
        metadata: { name: 'disallow-np' }
      },
      {
        kind:     'AdmissionPolicy',
        metadata: {
          name:      'ap1',
          namespace: 'ns1'
        }
      }
    ];

    const wrapper = createWrapper({
      props: {
        resource:        KUBEWARDEN.POLICY_SERVER,
        relatedPolicies: policies
      }
    });

    // Here, we *do not* call fetch if we plan to manually set specificValidations,
    // because fetch might overwrite them with the real Jaeger data (which we’ve mocked as empty).
    // Instead, we just do:
    wrapper.setData({
      specificValidations: mockTraces,
      isAdminUser:         true
    });

    await wrapper.vm.$nextTick();

    const checklist = wrapper.findComponent({ name: 'TraceChecklist' });

    expect(checklist.exists()).toBe(false); // showChecklist should be false
    expect(wrapper.findComponent({ name: 'SortableTable' }).exists()).toBe(true);
  });

  it('updates data properties via handleTracingChecklist method', () => {
    const wrapper = createWrapper();

    // Default
    expect(wrapper.vm.outdatedTelemetrySpec).toBe(false);

    // Update
    wrapper.vm.handleTracingChecklist('outdatedTelemetrySpec', true);
    expect(wrapper.vm.outdatedTelemetrySpec).toBe(true);
  });
});
