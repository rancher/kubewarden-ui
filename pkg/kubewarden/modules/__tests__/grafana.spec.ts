import {
  grafanaProxy,
  grafanaService,
  findKubewardenDashboards,
  addKubewardenDashboards
} from '@kubewarden/modules/grafana'; // Adjust the path accordingly
import { CONFIG_MAP } from '@shell/config/types';
import { CatalogApp, KubewardenDashboards } from '@kubewarden/types';

const createMockStore = () => ({ dispatch: jest.fn() });

const monitoringApp: CatalogApp = {
  metadata: {
    name:      'monitor-app',
    namespace: 'monitor-ns'
  }
} as CatalogApp;
const controllerApp: CatalogApp = {
  metadata: {
    name:      'controller-app',
    namespace: 'controller-ns'
  }
} as CatalogApp;

describe('grafanaProxy', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = createMockStore();
  });

  it('should return a valid proxy URL when grafanaService returns a valid service', async() => {
    const fakeService = {
      metadata: {
        namespace: 'foo-ns',
        name:      'grafana-svc'
      }
    };

    mockStore.dispatch.mockResolvedValueOnce(fakeService);
    const result = await grafanaProxy({
      store: mockStore,
      type:  'dashboard'
    });

    // Expected URL:
    // base = `/api/v1/namespaces/foo-ns/services`
    // proxy = `/http:grafana-svc:80/proxy`
    // path = `/d/dashboard?orgId=1&kiosk`
    expect(result).toBe('/api/v1/namespaces/foo-ns/services/http:grafana-svc:80/proxy/d/dashboard?orgId=1&kiosk');
  });

  it('should call handleGrowl and return null when an error occurs', async() => {
    const error = new Error('Test error');

    mockStore.dispatch.mockRejectedValueOnce(error);
    const handleGrowlSpy = jest.spyOn(require('../../utils/handle-growl'), 'handleGrowl');
    const result = await grafanaProxy({
      store: mockStore,
      type:  'dashboard'
    });

    expect(handleGrowlSpy).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

describe('grafanaService', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = createMockStore();
  });

  it('should return the service when store.dispatch resolves', async() => {
    const fakeService = {
      metadata: {
        namespace: 'foo-ns',
        name:      'grafana-svc'
      }
    };

    mockStore.dispatch.mockResolvedValueOnce(fakeService);
    const result = await grafanaService(mockStore);

    expect(result).toEqual(fakeService);
  });

  it('should call handleGrowl and return undefined when store.dispatch rejects', async() => {
    const error = new Error('Service error');

    mockStore.dispatch.mockRejectedValueOnce(error);
    const handleGrowlSpy = jest.spyOn(require('../../utils/handle-growl'), 'handleGrowl');
    const result = await grafanaService(mockStore);

    expect(handleGrowlSpy).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});

describe('findKubewardenDashboards', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = createMockStore();
  });

  it('should return the dashboards when store.dispatch resolves', async() => {
    const fakeResult = { metadata: { name: 'dashboard-config' } };

    mockStore.dispatch.mockResolvedValueOnce(fakeResult);
    const result = await findKubewardenDashboards(mockStore);

    expect(result).toEqual(fakeResult);
  });

  it('should call handleGrowl and return undefined on error', async() => {
    const error = new Error('Dashboard error');

    mockStore.dispatch.mockRejectedValueOnce(error);
    const handleGrowlSpy = jest.spyOn(require('../../utils/handle-growl'), 'handleGrowl');
    const result = await findKubewardenDashboards(mockStore);

    expect(handleGrowlSpy).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});

describe('addKubewardenDashboards', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = createMockStore();
  });

  let originalValues: any;

  beforeAll(() => {
    originalValues = Object.values;
    Object.values = () => [KubewardenDashboards.POLICY_SERVER];
  });
  afterAll(() => {
    Object.values = originalValues;
  });

  const stubFindDashboards = jest.spyOn(
    require('../grafana.ts'),
    'findKubewardenDashboards'
  );

  it('should create a new dashboard if no existing config map is found', async() => {
    stubFindDashboards.mockResolvedValue(null);

    await addKubewardenDashboards({
      store: mockStore,
      monitoringApp,
      controllerApp
    });

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      'cluster/create',
      expect.objectContaining({
        type:     CONFIG_MAP,
        metadata: expect.objectContaining({
          name:      KubewardenDashboards.POLICY_SERVER,
          namespace: 'cattle-dashboards'
        }),
        data: expect.any(Object)
      })
    );
  });

  it('should call handleGrowl if saving the config map fails', async() => {
    stubFindDashboards.mockResolvedValueOnce(null);
    jest.mock('../../assets/PolicyServer.json', () => ({ mock: 'data' }), { virtual: true });
    const fakeConfigMapTemplate = { save: jest.fn().mockRejectedValue(new Error('Save failed')) };

    mockStore.dispatch.mockResolvedValueOnce(fakeConfigMapTemplate);
    const handleGrowlSpy = jest.spyOn(require('../../utils/handle-growl'), 'handleGrowl');

    await addKubewardenDashboards({
      store: mockStore,
      monitoringApp,
      controllerApp
    });

    expect(handleGrowlSpy).toHaveBeenCalled();
  });

  it('should do nothing if monitoringApp or controllerApp is not provided', async() => {
    await addKubewardenDashboards({
      store:         mockStore,
      monitoringApp: null,
      controllerApp
    });
    expect(mockStore.dispatch).not.toHaveBeenCalled();

    await addKubewardenDashboards({
      store:         mockStore,
      monitoringApp,
      controllerApp: null
    });
    expect(mockStore.dispatch).not.toHaveBeenCalled();
  });
});
