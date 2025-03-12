import { shallowMount } from '@vue/test-utils';

import {
  CATALOG, CONFIG_MAP, MONITORING, NAMESPACE, SERVICE
} from '@shell/config/types';
import { KUBEWARDEN, KubewardenDashboardLabels } from '@kubewarden/types';
import { KUBERNETES } from '@shell/config/labels-annotations';

import KubewardenDashboard from '@kubewarden/components/MetricsTab.vue';
import mockControllerChart from '@tests/unit/mocks/controllerChart';
import mockPolicyServers from '@tests/unit/mocks/policyServers';
import { mockControllerApp } from '@tests/unit/mocks/controllerApp';

// Create a mock for the 'cluster/all' getter that returns different values based on the input.
const clusterAllMock = jest.fn((resourceType) => {
  switch (resourceType) {
  case CATALOG.APP:
    return [
      {
        // Monitoring app: used by monitoringApp computed property
        spec: {
          chart: {
            metadata: {
              name:    'rancher-monitoring',
              version: '1.0.0'
            }
          }
        }
      },
      { ...mockControllerApp }
    ];
  case CATALOG.CLUSTER_REPO:
    return [];
  case KUBEWARDEN.POLICY_SERVER:
    return mockPolicyServers;
  case CONFIG_MAP:
    return [{
      metadata: {
        name:   'config-map-1',
        labels: { [KubewardenDashboardLabels.DASHBOARD]: 'true' }
      }
    }];
  case MONITORING.SERVICEMONITOR:
    return [{
      metadata: { name: 'service-monitor-1' },
      spec:     {
        selector: {
          matchLabels: {
            // Match the policy server id passed via props (e.g. 'policy-server-1')
            app: 'kubewarden-policy-server-policy-server-1'
          }
        }
      }
    }];
  case NAMESPACE:
    return [{ metadata: { name: 'namespace-1' } }];
  case SERVICE:
    return [{
      metadata: {
        name:   'service-1',
        labels: { [KUBERNETES.MANAGED_NAME]: 'opentelemetry-operator' }
      },
      spec: { ports: [{ port: 8080 }] }
    }];
  default:
    return [];
  }
});

const commonMocks = {
  $fetchState: { pending: false },
  $store:      {
    getters: {
      currentCluster:               () => ({ id: 'cluster-1' }),
      currentStore:                 () => 'cluster',
      productId:                    () => 'some-product',
      'catalog/charts':             [mockControllerChart],
      'cluster/all':                clusterAllMock,
      'cluster/canList':            () => true,
      'i18n/t':                     (key) => key,
      'management/byId':            () => 'local',
      'resource-fetch/refreshFlag': jest.fn(),
      'cluster/schemaFor':          () => ({ attributes: { namespaced: false } })
    },
    dispatch: jest.fn()
  },
  $route: { params: { cluster: '_' } }
};

const commonStubs = { 'router-link': { template: '<span />' } };
const metricsProxy = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/kubewarden-dashboard-policyserver?orgId=1&kiosk';

const createWrapper = (options: any = {}) => {
  return shallowMount(KubewardenDashboard, {
    global: {
      mocks: {
        ...commonMocks,
        ...options.mocks
      },
      stubs: {
        ...commonStubs,
        Loading:          true,
        Banner:           true,
        DashboardMetrics: true,
        MetricsChecklist: true,
        ...options.stubs
      },
    },
    props: { ...options.props }
  });
};

describe('KubewardenDashboard Component', () => {
  it('renders the Loading component when fetch state is pending', () => {
    const wrapper = createWrapper({ mocks: { $fetchState: { pending: true } } });

    expect(wrapper.findComponent({ name: 'Loading' }).exists()).toBe(true);
  });

  it('renders MetricsChecklist when showChecklist is true', () => {
    // With the above data, computed showChecklist should be true if any required condition is missing.
    // In this test, we let the checklist appear.
    const wrapper = createWrapper({
      props: {
        policyObj:       {},
        policyServerObj: {} // purposely not setting a valid policy server so that showChecklist is true
      }
    });

    expect(wrapper.findComponent({ name: 'MetricsChecklist' }).exists()).toBe(true);
  });

  it('renders Banner when showChecklist is false (all dependencies present) but metricsProxy is null', () => {
    // Pass a valid policyServerObj so the SM is found
    // and we have the telemetry set, dashboards found, etc.
    // That means showChecklist = false. Because the store mocks have everything needed.
    const wrapper = createWrapper({
      props: {
        policyServerObj: {
          id:       'policy-server-1',
          metadata: {
            labels: { app: 'kubewarden-policy-server-policy-server-1' },
            uid:    'asdf'
          }
        }
      }
    });

    // By default, metricsProxy is null => so we expect the Banner to appear
    expect(wrapper.findComponent({ name: 'MetricsChecklist' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'Banner' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'DashboardMetrics' }).exists()).toBe(false);
  });

  it('renders DashboardMetrics when showChecklist is false, metricsProxy exists, and active prop is true', async() => {
    const wrapper = createWrapper({
      props: {
        active:          true,
        policyServerObj: { id: 'policy-server-1' }
      }
    });

    // Simulate that we found a valid metricsProxy from Grafana
    wrapper.setData({ metricsProxy });

    await wrapper.vm.$nextTick();

    // Now showChecklist should be false, metricsProxy is set, active is true => show the DashboardMetrics
    expect(wrapper.findComponent({ name: 'MetricsChecklist' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'Banner' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'DashboardMetrics' }).exists()).toBe(true);
  });

  it('updates data properties via handleMetricsChecklist method', () => {
    const wrapper = createWrapper();

    // Verify initial values
    expect(wrapper.vm.outdatedTelemetrySpec).toBe(false);
    expect(wrapper.vm.unsupportedTelemetrySpec).toBe(false);
    // Call the method and check that the corresponding data property is updated
    wrapper.vm.handleMetricsChecklist('outdatedTelemetrySpec', true);
    expect(wrapper.vm.outdatedTelemetrySpec).toBe(true);
    wrapper.vm.handleMetricsChecklist('unsupportedTelemetrySpec', true);
    expect(wrapper.vm.unsupportedTelemetrySpec).toBe(true);
  });
});
