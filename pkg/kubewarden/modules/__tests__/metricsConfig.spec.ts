import { Store } from 'vuex';
import { MONITORING } from '@shell/config/types';

import {
  CatalogApp,
  Service,
  ServiceMonitorSpec
} from '@kubewarden/types';
import {
  monitoringIsConfigured,
  serviceMonitorsConfigured,
  findServiceMonitor,
  addKubewardenServiceMonitor
} from '@kubewarden/modules/metricsConfig';

jest.mock('@kubewarden/utils/handle-growl', () => ({ handleGrowl: jest.fn() }));

const mockControllerApp: CatalogApp = {
  metadata: {
    name:      'controller-app',
    namespace: 'controller-ns'
  }
} as CatalogApp;

const mockServiceMonitorSpec: ServiceMonitorSpec = {
  namespaceSelector: { matchNames: ['controller-ns'] },
  selector:          { matchLabels: { 'app-label': 'match-me' } }
};

const mockServiceMonitorConfiguredExpected = {
  namespace: true,
  selectors: [{ 'app-label': true }]
};

function createMockStore(getSchemaFor = true) {
  return {
    getters: {
      'cluster/schemaFor': jest.fn().mockReturnValue(getSchemaFor),
      currentCluster:      { id: 'mock-cluster' }
    },
    dispatch: jest.fn()
  } as unknown as Store<any>;
}

describe('monitoringIsConfigured', () => {
  it('should return true if at least one service monitor spec is configured correctly', () => {
    const config = {
      serviceMonitorSpec: [mockServiceMonitorSpec],
      controllerApp:      mockControllerApp,
      policyServerSvcs:   [{ metadata: { labels: { 'app-label': 'match-me' } } } as Service]
    };

    const configuredArray = serviceMonitorsConfigured(config);

    // It should be an array; and monitoringIsConfigured should return true.
    expect(Array.isArray(configuredArray)).toBe(true);
    expect(configuredArray).toHaveLength(1);
    expect(configuredArray[0]).toEqual(mockServiceMonitorConfiguredExpected);
    expect(monitoringIsConfigured(config)).toBe(true);
  });

  it('should return false if no spec is configured correctly', () => {
    // Use a spec that does not have a matching namespace
    const badSpec = {
      namespaceSelector: { matchNames: ['wrong-ns'] },
      selector:          { matchLabels: { 'app-label': 'nomatch' } }
    };
    const config = {
      serviceMonitorSpec: [badSpec],
      controllerApp:      mockControllerApp,
      policyServerSvcs:   [{ metadata: { labels: { 'app-label': 'match-me' } } } as Service]
    };

    expect(monitoringIsConfigured(config)).toBe(false);
  });
});

describe('serviceMonitorsConfigured', () => {
  it('should return an array of configured objects based on serviceMonitorSpec', () => {
    const config = {
      serviceMonitorSpec: [mockServiceMonitorSpec],
      controllerApp:      mockControllerApp,
      policyServerSvcs:   [
        { metadata: { labels: { 'app-label': 'match-me' } } } as Service,
        { metadata: { labels: { 'app-label': 'no-match' } } } as Service
      ]
    };

    const result = serviceMonitorsConfigured(config);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].namespace).toBe(true);
    expect(result[0].selectors).toEqual([{ 'app-label': true }, { 'app-label': false }]);
  });

  it('should return false if serviceMonitorSpec is not provided', () => {
    const config = {
      serviceMonitorSpec: undefined,
      controllerApp:      mockControllerApp,
      policyServerSvcs:   []
    };

    expect(serviceMonitorsConfigured(config)).toBe(false);
  });
});

describe('findServiceMonitor', () => {
  it('should return a matching ServiceMonitor based on selector.matchLabels', () => {
    const policyObj = { spec: { policyServer: 'mock' } };
    const allServiceMonitors = [
      { spec: { selector: { matchLabels: { app: 'kubewarden-policy-server-mock' } } } },
      { spec: { selector: { matchLabels: { app: 'other' } } } }
    ];
    const config = {
      policyObj,
      allServiceMonitors,
      store: {}
    };
    const result = findServiceMonitor(config);

    expect(result).toEqual(allServiceMonitors[0]);
  });

  it('should return undefined if no matching ServiceMonitor is found', () => {
    const policyServerObj = { id: 'nonexistent' };
    const allServiceMonitors = [
      { spec: { selector: { matchLabels: { app: 'kubewarden-policy-server-mock' } } } }
    ];
    const config = {
      policyServerObj,
      allServiceMonitors,
      store: {}
    };
    const result = findServiceMonitor(config);

    expect(result).toBeUndefined();
  });
});

describe('addKubewardenServiceMonitor', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = createMockStore(true);
    jest.clearAllMocks();
  });

  it('should create a new ServiceMonitor when schema exists and none is provided', async() => {
    const fakeServiceMonitorTemplate = { save: jest.fn().mockResolvedValue(undefined) };

    mockStore.dispatch.mockResolvedValueOnce(fakeServiceMonitorTemplate);

    const config = {
      store:           mockStore,
      policyServerObj: { id: 'mock' },
      controllerNs:    'controller-ns'
    };

    await addKubewardenServiceMonitor(config);

    expect(mockStore.getters['cluster/schemaFor']).toHaveBeenCalledWith(MONITORING.SERVICEMONITOR);
    expect(mockStore.dispatch).toHaveBeenCalledWith('cluster/create', expect.objectContaining({
      type:     MONITORING.SERVICEMONITOR,
      metadata: expect.objectContaining({
        name:      'mock',
        namespace: 'controller-ns'
      })
    }));
    expect(fakeServiceMonitorTemplate.save).toHaveBeenCalled();
  });

  it('should call handleGrowl if saving the created ServiceMonitor fails', async() => {
    const fakeServiceMonitorTemplate = { save: jest.fn().mockRejectedValue(new Error('Save failed')) };

    mockStore.dispatch.mockResolvedValueOnce(fakeServiceMonitorTemplate);
    const handleGrowlSpy = jest.spyOn(require('@kubewarden/utils/handle-growl'), 'handleGrowl');
    const config = {
      store:           mockStore,
      policyServerObj: { id: 'mock' },
      controllerNs:    'controller-ns'
    };

    await addKubewardenServiceMonitor(config);
    expect(handleGrowlSpy).toHaveBeenCalled();
  });

  it('should do nothing if a ServiceMonitor is already provided', async() => {
    const config = {
      store:           mockStore,
      policyServerObj: { id: 'mock' },
      controllerNs:    'controller-ns',
      serviceMonitor:  {}
    };

    await addKubewardenServiceMonitor(config);
    expect(mockStore.dispatch).not.toHaveBeenCalledWith('cluster/create', expect.anything());
  });

  it('should do nothing if the schema for ServiceMonitor is falsy', async() => {
    const badStore = createMockStore(false);
    const config = {
      store:           badStore,
      policyServerObj: { id: 'mock' },
      controllerNs:    'controller-ns'
    };

    await addKubewardenServiceMonitor(config);
    expect(badStore.dispatch).not.toHaveBeenCalled();
  });
});
